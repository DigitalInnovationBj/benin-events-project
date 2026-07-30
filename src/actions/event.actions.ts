"use server";

import { getCurrentUser } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createPayment } from "@/lib/geniuspay";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function generateSlug(title: string) {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

// Le champ datetime-local ne transporte pas de fuseau horaire.
// On interprète explicitement la saisie comme heure locale du Bénin (UTC+1).
function parseBeninLocalDate(dateTimeLocal: string): Date {
    return new Date(`${dateTimeLocal}:00+01:00`);
}

// ─────────────────────────────────────────────
// getCategories — lecture publique
// ─────────────────────────────────────────────

export async function getCategories() {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true, slug: true },
        });
        return { categories };
    } catch (error) {
        console.error("Erreur getCategories:", error);
        return {
            error: "Impossible de charger les catégories.",
            categories: [],
        };
    }
}

// ─────────────────────────────────────────────
// createEvent — schéma de validation
// ─────────────────────────────────────────────

const createEventSchema = z
    .object({
        title: z.string().min(3, "Le titre est trop court"),
        description: z.string().min(10, "La description est trop courte"),
        eventType: z.enum(["IN_PERSON", "ONLINE"]),
        location: z.string().optional(),
        onlineUrl: z
            .string()
            .url("L'URL de l'évènement est invalide")
            .optional()
            .or(z.literal("")),
        startDate: z.string().refine((d) => !isNaN(Date.parse(d)), {
            message: "Date de début invalide",
        }),
        endDate: z.string().refine((d) => !isNaN(Date.parse(d)), {
            message: "Date de fin invalide",
        }),
        ogTitle: z.string().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.eventType === "IN_PERSON" && !data.location?.trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Le lieu est requis pour un évènement en présentiel.",
                path: ["location"],
            });
        }
        if (data.eventType === "ONLINE" && !data.onlineUrl?.trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "L'URL est requise pour un évènement en ligne.",
                path: ["onlineUrl"],
            });
        }
    });

// ─────────────────────────────────────────────
// createEvent — action principale
// ─────────────────────────────────────────────

export async function createEvent(formData: FormData) {
    try {
        // Vérifier si l'utilisateur est ORGANIZER ou ADMIN
        const dbUser = await getCurrentUser();

        if (
            !dbUser ||
            (dbUser.role !== "ORGANIZER" && dbUser.role !== "ADMIN")
        ) {
            return {
                error: "Permission refusée. Vous devez être organisateur.",
            };
        }

        // ── Valider les données ────────────────────────────────────────────
        const parsedData = createEventSchema.safeParse({
            title: formData.get("title"),
            description: formData.get("description"),
            eventType: formData.get("eventType") ?? "IN_PERSON",
            location: formData.get("location") || undefined,
            onlineUrl: formData.get("onlineUrl") || undefined,
            startDate: formData.get("startDate"),
            endDate: formData.get("endDate"),
            ogTitle: formData.get("ogTitle") || undefined,
        });

        if (!parsedData.success) {
            const errorMessage =
                parsedData.error.issues?.[0]?.message || "Données invalides";
            return { error: errorMessage };
        }

        const data = parsedData.data;

        // ── Catégories ────────────────────────────────────────────────────
        // Le formulaire envoie plusieurs champs "categoryIds" (un par catégorie sélectionnée)
        const categoryIds = formData.getAll("categoryIds") as string[];

        // ── Slug unique ───────────────────────────────────────────────────
        let slug = generateSlug(data.title);
        let count = 1;
        while (await prisma.event.findUnique({ where: { slug } })) {
            slug = `${generateSlug(data.title)}-${count}`;
            count++;
        }

        // ── Upload image principale ───────────────────────────────────────
        const imageFile = formData.get("image") as File | null;
        if (imageFile && imageFile.size > 1024 * 1024) {
            return { error: "L'image de l'évènement dépasse 1 Mo." };
        }

        let imageUrl: string | null = null;
        if (imageFile && imageFile.size > 0) {
            const blob = await put(
                `events/${slug}-${imageFile.name}`,
                imageFile,
                { access: "public" },
            );
            imageUrl = blob.url;
        }

        // ── Upload image OG ───────────────────────────────────────────────
        const ogImageFile = formData.get("ogImage") as File | null;
        if (ogImageFile && ogImageFile.size > 1024 * 1024) {
            return { error: "L'image de partage dépasse 1 Mo." };
        }

        let ogImageUrl: string | null = imageUrl; // fallback sur l'image principale
        if (ogImageFile && ogImageFile.size > 0) {
            const blob = await put(
                `events/og-${slug}-${ogImageFile.name}`,
                ogImageFile,
                { access: "public" },
            );
            ogImageUrl = blob.url;
        }

        // ── Vérification des frais de création ───────────────────────────
        const settings = await prisma.platformSettings.upsert({
            where: { id: "singleton" },
            create: { id: "singleton", commissionRate: 0, eventCreationFeeEnabled: false, eventCreationFee: 5000, featuredEventFeeEnabled: false, featuredEventFee: 5000 },
            update: {},
        });

        const requiresPayment = settings.eventCreationFeeEnabled && dbUser.role !== "ADMIN";

        // ── Créer l'évènement ─────────────────────────────────────────────
        const event = await prisma.event.create({
            data: {
                title: data.title,
                slug,
                description: data.description,
                eventType: data.eventType,
                location: data.eventType === "IN_PERSON" ? data.location : null,
                onlineUrl: data.eventType === "ONLINE" ? data.onlineUrl : null,
                startDate: parseBeninLocalDate(data.startDate),
                endDate: parseBeninLocalDate(data.endDate),
                imageUrl,
                ogTitle: data.ogTitle || data.title,
                ogImage: ogImageUrl,
                organizerId: dbUser.id,
                isPublished: !requiresPayment,
                categories:
                    categoryIds.length > 0
                        ? {
                              create: categoryIds.map((categoryId) => ({
                                  category: { connect: { id: categoryId } },
                              })),
                          }
                        : undefined,
            },
        });

        if (!requiresPayment) {
            revalidatePath("/dashboard/events");
            revalidatePath("/");
            return { success: true, eventId: event.id, slug: event.slug };
        }

        // ── Créer le paiement de publication ─────────────────────────────
        const amount = settings.eventCreationFee;
        const platformPayment = await prisma.platformPayment.create({
            data: {
                type: "EVENT_CREATION",
                status: "PENDING",
                amount,
                eventId: event.id,
                userId: dbUser.id,
            },
        });

        try {
            const paymentRes = await createPayment({
                amount,
                description: `Publication d'évènement — ${data.title}`,
                customer: { name: dbUser.name ?? undefined, email: dbUser.email },
                success_url: `${APP_URL}/dashboard/events/${event.id}?created=1`,
                error_url: `${APP_URL}/dashboard/events/new?payment_error=1`,
                metadata: {
                    payment_context: "platform",
                    platform_payment_id: platformPayment.id,
                    platform_payment_type: "EVENT_CREATION",
                    event_id: event.id,
                },
            });

            const { reference, checkout_url, id: geniuspayId } = paymentRes.data;
            await prisma.platformPayment.update({
                where: { id: platformPayment.id },
                data: { reference, geniuspayId, checkoutUrl: checkout_url },
            });

            return { success: true, eventId: event.id, slug: event.slug, redirectUrl: checkout_url };
        } catch (err) {
            console.error("GeniusPay event creation payment error:", err);
            await prisma.platformPayment.update({
                where: { id: platformPayment.id },
                data: { status: "FAILED" },
            });
            return { error: "Service de paiement indisponible. L'évènement a été sauvegardé mais n'est pas encore publié." };
        }
    } catch (error) {
        console.error("Erreur createEvent:", error);
        return {
            error: "Une erreur interne s'est produite lors de la création de l'évènement.",
        };
    }
}

// ─────────────────────────────────────────────
// updateEvent — action de modification
// ─────────────────────────────────────────────

const updateEventSchema = z
    .object({
        eventId: z.string().min(1, "ID requis"),
        title: z.string().min(3, "Le titre est trop court"),
        description: z.string().min(10, "La description est trop courte"),
        eventType: z.enum(["IN_PERSON", "ONLINE"]),
        location: z.string().optional(),
        onlineUrl: z
            .string()
            .url("L'URL de l'évènement est invalide")
            .optional()
            .or(z.literal("")),
        startDate: z.string().refine((d) => !isNaN(Date.parse(d)), {
            message: "Date de début invalide",
        }),
        endDate: z.string().refine((d) => !isNaN(Date.parse(d)), {
            message: "Date de fin invalide",
        }),
        ogTitle: z.string().optional(),
        isFeatured: z.enum(["true", "false"]).optional(),
    })
    .superRefine((data, ctx) => {
        if (data.eventType === "IN_PERSON" && !data.location?.trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Le lieu est requis pour un évènement en présentiel.",
                path: ["location"],
            });
        }
        if (data.eventType === "ONLINE" && !data.onlineUrl?.trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "L'URL est requise pour un évènement en ligne.",
                path: ["onlineUrl"],
            });
        }
    });

export async function updateEvent(formData: FormData) {
    try {
        const dbUser = await getCurrentUser();

        if (
            !dbUser ||
            (dbUser.role !== "ORGANIZER" && dbUser.role !== "ADMIN")
        ) {
            return { error: "Permission refusée." };
        }

        const eventId = formData.get("eventId") as string;
        const existingEvent = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!existingEvent) return { error: "Évènement introuvable." };
        if (
            dbUser.role !== "ADMIN" &&
            existingEvent.organizerId !== dbUser.id
        ) {
            return {
                error: "Vous n'êtes pas le propriétaire de cet évènement.",
            };
        }

        // ── Valider les données ────────────────────────────────────────────
        const parsedData = updateEventSchema.safeParse({
            eventId,
            title: formData.get("title"),
            description: formData.get("description"),
            eventType: formData.get("eventType") ?? "IN_PERSON",
            location: formData.get("location") || undefined,
            onlineUrl: formData.get("onlineUrl") || undefined,
            startDate: formData.get("startDate"),
            endDate: formData.get("endDate"),
            ogTitle: formData.get("ogTitle") || undefined,
            isFeatured: formData.get("isFeatured") || undefined,
        });

        if (!parsedData.success) {
            return {
                error:
                    parsedData.error.issues[0]?.message || "Données invalides",
            };
        }

        const data = parsedData.data;

        // ── Catégories ────────────────────────────────────────────────────
        const categoryIds = formData.getAll("categoryIds") as string[];

        // ── Upload image principale (optionnel) ───────────────────────────
        const imageFile = formData.get("image") as File | null;
        if (imageFile && imageFile.size > 1024 * 1024) {
            return { error: "L'image de l'évènement dépasse 1 Mo." };
        }

        let imageUrl: string | null = existingEvent.imageUrl;
        if (imageFile && imageFile.size > 0) {
            const blob = await put(
                `events/${existingEvent.slug}-${Date.now()}-${imageFile.name}`,
                imageFile,
                { access: "public" },
            );
            imageUrl = blob.url;
        }

        // ── Upload image OG (optionnel) ───────────────────────────────────
        const ogImageFile = formData.get("ogImage") as File | null;
        if (ogImageFile && ogImageFile.size > 1024 * 1024) {
            return { error: "L'image de partage dépasse 1 Mo." };
        }

        let ogImageUrl: string | null = existingEvent.ogImage;
        if (ogImageFile && ogImageFile.size > 0) {
            const blob = await put(
                `events/og-${existingEvent.slug}-${Date.now()}-${ogImageFile.name}`,
                ogImageFile,
                { access: "public" },
            );
            ogImageUrl = blob.url;
        } else if (!existingEvent.ogImage && imageUrl) {
            // Si aucune og image n'existait et qu'une nouvelle image principale a été uploadée
            ogImageUrl = imageUrl;
        }

        // ── Mise à jour des catégories ────────────────────────────────────
        await prisma.eventCategory.deleteMany({ where: { eventId } });
        if (categoryIds.length > 0) {
            await prisma.eventCategory.createMany({
                data: categoryIds.map((categoryId) => ({
                    eventId,
                    categoryId,
                })),
            });
        }

        // ── Mise à jour de l'évènement ────────────────────────────────────
        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: {
                title: data.title,
                description: data.description,
                eventType: data.eventType,
                location: data.eventType === "IN_PERSON" ? data.location : null,
                onlineUrl: data.eventType === "ONLINE" ? data.onlineUrl : null,
                startDate: parseBeninLocalDate(data.startDate),
                endDate: parseBeninLocalDate(data.endDate),
                imageUrl,
                ogTitle: data.ogTitle || data.title,
                ogImage: ogImageUrl,
                ...(dbUser.role === "ADMIN" && data.isFeatured !== undefined
                    ? { isFeatured: data.isFeatured === "true" }
                    : {}),
            },
        });

        revalidatePath(`/dashboard/events/${eventId}`);
        revalidatePath(`/dashboard/events/${eventId}/edit`);
        revalidatePath(`/events/${existingEvent.slug}`);
        revalidatePath("/");

        return { success: true, eventId: updatedEvent.id };
    } catch (error) {
        console.error("Erreur updateEvent:", error);
        return {
            error: "Une erreur interne s'est produite lors de la modification.",
        };
    }
}

// ─────────────────────────────────────────────
// toggleLike
// ─────────────────────────────────────────────

export async function toggleLike(eventId: string) {
    try {
        const dbUser = await getCurrentUser();
        if (!dbUser) return { error: "Vous devez être connecté." };

        const existing = await prisma.like.findUnique({
            where: {
                userId_eventId: { userId: dbUser.id, eventId },
            },
        });

        if (existing) {
            await prisma.like.delete({
                where: { userId_eventId: { userId: dbUser.id, eventId } },
            });
            return { liked: false };
        } else {
            await prisma.like.create({
                data: { userId: dbUser.id, eventId },
            });
            return { liked: true };
        }
    } catch (error) {
        console.error("Erreur toggleLike:", error);
        return { error: "Erreur interne." };
    }
}

// ─────────────────────────────────────────────
// toggleFavorite
// ─────────────────────────────────────────────

export async function toggleFavorite(eventId: string) {
    try {
        const dbUser = await getCurrentUser();
        if (!dbUser) return { error: "Vous devez être connecté." };

        const existing = await prisma.favorite.findUnique({
            where: {
                userId_eventId: { userId: dbUser.id, eventId },
            },
        });

        if (existing) {
            await prisma.favorite.delete({
                where: { userId_eventId: { userId: dbUser.id, eventId } },
            });
            return { favorited: false };
        } else {
            await prisma.favorite.create({
                data: { userId: dbUser.id, eventId },
            });
            return { favorited: true };
        }
    } catch (error) {
        console.error("Erreur toggleFavorite:", error);
        return { error: "Erreur interne." };
    }
}

// ─────────────────────────────────────────────
// incrementShareCount
// ─────────────────────────────────────────────

export async function incrementShareCount(eventId: string) {
    try {
        await prisma.event.update({
            where: { id: eventId },
            data: { shareCount: { increment: 1 } },
        });
        return { success: true };
    } catch (error) {
        console.error("Erreur incrementShareCount:", error);
        return { error: "Erreur interne." };
    }
}

// ─────────────────────────────────────────────
// deleteEvent (soft delete)
// ─────────────────────────────────────────────

export async function deleteEvent(eventId: string) {
    try {
        const dbUser = await getCurrentUser();

        if (!dbUser) return { error: "Non authentifié" };

        if (dbUser.role !== "ORGANIZER" && dbUser.role !== "ADMIN") {
            return {
                error: "Vous n'avez pas la permission de supprimer un évènement",
            };
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { organizerId: true, isDeleted: true, title: true },
        });

        if (!event) return { error: "Évènement introuvable" };
        if (event.isDeleted)
            return { error: "Cet évènement est déjà supprimé" };

        // Seul l'organisateur propriétaire ou un admin peut supprimer
        if (dbUser.role !== "ADMIN" && event.organizerId !== dbUser.id) {
            return {
                error: "Vous n'êtes pas autorisé à supprimer cet évènement",
            };
        }

        await prisma.event.update({
            where: { id: eventId },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        });

        revalidatePath("/dashboard/events");
        revalidatePath("/events");
        revalidatePath("/");

        return { success: true };
    } catch (error) {
        console.error("Erreur deleteEvent:", error);
        return { error: "Une erreur est survenue lors de la suppression" };
    }
}
