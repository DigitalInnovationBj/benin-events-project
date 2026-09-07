"use server";

import { getCurrentUser } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { deriveCitySlug, isCitySlug } from "@/lib/cities";
import { buildSearchText } from "@/lib/search";
import { put } from "@vercel/blob";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
    createPayment,
    encodeCallbackInfo,
    getNetwork,
    isValidNetwork,
    isValidLocalNumber,
    type FeexpayNetwork,
} from "@/lib/feexpay";
import { sendEventCancellationEmail } from "@/lib/email";

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
        city: z.string().optional(),
        onlineUrl: z
            .string()
            .url("L'URL de l'évènement est invalide")
            .optional()
            .or(z.literal("")),
        postPurchaseMessage: z.string().optional(),
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

export type CreateEventResult =
    | { success: true; eventId: string; slug: string; platformPaymentId?: string }
    | { error: string };

export async function createEvent(formData: FormData): Promise<CreateEventResult> {
    // Vérifier si l'utilisateur est ORGANIZER ou ADMIN
    const dbUser = await getCurrentUser();

    if (!dbUser || (dbUser.role !== "ORGANIZER" && dbUser.role !== "ADMIN")) {
        return { error: "Permission refusée. Vous devez être organisateur." };
    }

    return createEventForOrganizer(dbUser.id, formData, {
        // Un admin qui crée son propre évènement échappe déjà aux frais
        // (logique historique) ; ce flag ne sert qu'au cas "admin publie
        // pour un tiers" (createEventOnBehalf), qui saute toujours les frais.
        skipFee: dbUser.role === "ADMIN",
    });
}

// ─────────────────────────────────────────────
// createEventForOrganizer — logique partagée entre createEvent (self-service)
// et createEventOnBehalf (admin publie pour un organisateur ciblé). N'effectue
// AUCUNE vérification de permission elle-même : l'appelant doit avoir déjà
// validé que l'action est autorisée pour `organizerId`.
// ─────────────────────────────────────────────

export async function createEventForOrganizer(
    organizerId: string,
    formData: FormData,
    options: { skipFee?: boolean } = {},
): Promise<CreateEventResult> {
    try {
        // ── Valider les données ────────────────────────────────────────────
        const parsedData = createEventSchema.safeParse({
            title: formData.get("title"),
            description: formData.get("description"),
            eventType: formData.get("eventType") ?? "IN_PERSON",
            location: formData.get("location") || undefined,
            city: formData.get("city") || undefined,
            onlineUrl: formData.get("onlineUrl") || undefined,
            postPurchaseMessage: formData.get("postPurchaseMessage") || undefined,
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

        const requiresPayment = settings.eventCreationFeeEnabled && !options.skipFee;

        // ── Validation Mobile Money (requise si frais de publication) ─────
        let network: FeexpayNetwork | undefined;
        let fullPhoneNumber: string | undefined;
        if (requiresPayment) {
            const networkInput = formData.get("network") as string | null;
            const phoneInput = formData.get("phoneNumber") as string | null;
            if (!networkInput || !isValidNetwork(networkInput)) {
                return { error: "Sélectionnez un opérateur mobile money." };
            }
            const netInfo = getNetwork(networkInput);
            const localDigits = (phoneInput ?? "").replace(/\D/g, "");
            if (!netInfo || !isValidLocalNumber(localDigits, netInfo.countryCode)) {
                return { error: "Numéro de téléphone invalide." };
            }
            network = networkInput;
            fullPhoneNumber = `${netInfo.dialCode}${localDigits}`;
        }

        // ── Créer l'évènement ─────────────────────────────────────────────
        const event = await prisma.event.create({
            data: {
                title: data.title,
                slug,
                description: data.description,
                eventType: data.eventType,
                location: data.eventType === "IN_PERSON" ? data.location : null,
                // Ville normalisée : valeur choisie dans le formulaire,
                // sinon déduite de l'adresse libre. Sert aux filtres et aux comptages.
                city:
                    data.eventType === "IN_PERSON"
                        ? data.city && isCitySlug(data.city)
                            ? data.city
                            : deriveCitySlug(data.location ?? null)
                        : null,
                searchText: buildSearchText(
                    data.title,
                    data.description,
                    data.eventType === "IN_PERSON" ? (data.location ?? null) : null,
                ),
                onlineUrl: data.eventType === "ONLINE" ? data.onlineUrl : null,
                postPurchaseMessage: data.postPurchaseMessage || null,
                startDate: parseBeninLocalDate(data.startDate),
                endDate: parseBeninLocalDate(data.endDate),
                imageUrl,
                ogTitle: data.ogTitle || data.title,
                ogImage: ogImageUrl,
                organizerId,
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

        // ── Créer le paiement de publication (FeexPay — Mobile Money) ─────
        const amount = settings.eventCreationFee;
        const platformPayment = await prisma.platformPayment.create({
            data: {
                type: "EVENT_CREATION",
                status: "PENDING",
                amount,
                eventId: event.id,
                userId: organizerId,
                payerPhone: fullPhoneNumber,
                payerNetwork: network,
            },
        });

        try {
            const paymentRes = await createPayment({
                amount,
                phoneNumber: fullPhoneNumber!,
                network: network!,
                description: `Publication d'évènement — ${data.title}`,
                callbackInfo: encodeCallbackInfo("platform", platformPayment.id),
            });

            await prisma.platformPayment.update({
                where: { id: platformPayment.id },
                data: { providerReference: paymentRes.reference },
            });

            return {
                success: true,
                eventId: event.id,
                slug: event.slug,
                platformPaymentId: platformPayment.id,
            };
        } catch (err) {
            console.error("FeexPay event creation payment error:", err);
            await prisma.platformPayment.update({
                where: { id: platformPayment.id },
                data: { status: "FAILED" },
            });
            const reason = err instanceof Error ? err.message : null;
            return {
                error: reason
                    ? `Paiement refusé : ${reason}. L'évènement a été sauvegardé mais n'est pas encore publié.`
                    : "Service de paiement indisponible. L'évènement a été sauvegardé mais n'est pas encore publié.",
            };
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
        city: z.string().optional(),
        onlineUrl: z
            .string()
            .url("L'URL de l'évènement est invalide")
            .optional()
            .or(z.literal("")),
        postPurchaseMessage: z.string().optional(),
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
            city: formData.get("city") || undefined,
            onlineUrl: formData.get("onlineUrl") || undefined,
            postPurchaseMessage: formData.get("postPurchaseMessage") || undefined,
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
                // Ville normalisée : valeur choisie dans le formulaire,
                // sinon déduite de l'adresse libre. Sert aux filtres et aux comptages.
                city:
                    data.eventType === "IN_PERSON"
                        ? data.city && isCitySlug(data.city)
                            ? data.city
                            : deriveCitySlug(data.location ?? null)
                        : null,
                searchText: buildSearchText(
                    data.title,
                    data.description,
                    data.eventType === "IN_PERSON" ? (data.location ?? null) : null,
                ),
                onlineUrl: data.eventType === "ONLINE" ? data.onlineUrl : null,
                postPurchaseMessage: data.postPurchaseMessage || null,
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

// ─────────────────────────────────────────────
// cancelEvent — annulation (évènement conservé, dépublié, remboursements dus)
// ─────────────────────────────────────────────

export async function cancelEvent(eventId: string, reason?: string) {
    try {
        const dbUser = await getCurrentUser();
        if (!dbUser) return { error: "Non authentifié" };

        if (dbUser.role !== "ORGANIZER" && dbUser.role !== "ADMIN") {
            return { error: "Vous n'avez pas la permission d'annuler un évènement" };
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                title: true,
                slug: true,
                startDate: true,
                location: true,
                eventType: true,
                organizerId: true,
                isDeleted: true,
                isCancelled: true,
            },
        });

        if (!event) return { error: "Évènement introuvable" };
        if (event.isDeleted) return { error: "Cet évènement est supprimé" };
        if (event.isCancelled) return { error: "Cet évènement est déjà annulé" };

        if (dbUser.role !== "ADMIN" && event.organizerId !== dbUser.id) {
            return { error: "Vous n'êtes pas autorisé à annuler cet évènement" };
        }

        await prisma.event.update({
            where: { id: eventId },
            data: {
                isCancelled: true,
                cancelledAt: new Date(),
                cancellationReason: reason?.trim() || null,
                isPublished: false,
            },
        });

        // ── Notifier les acheteurs de billets payés (remboursement à venir) ──
        const orders = await prisma.order.findMany({
            where: { eventId, status: "COMPLETED" },
            select: {
                id: true,
                reference: true,
                totalAmount: true,
                guestEmail: true,
                guestName: true,
                user: { select: { email: true, name: true } },
            },
        });

        const eventDate = event.startDate.toLocaleDateString("fr-FR", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
            hour: "2-digit", minute: "2-digit", timeZone: "Africa/Porto-Novo",
        });

        await Promise.allSettled(
            orders.map((order) => {
                const email = order.user?.email ?? order.guestEmail;
                const name = order.user?.name ?? order.guestName ?? "Client";
                if (!email) return Promise.resolve();
                return sendEventCancellationEmail({
                    to: email,
                    recipientName: name,
                    eventTitle: event.title,
                    eventDate,
                    orderReference: order.reference,
                    totalAmount: order.totalAmount,
                    reason: reason?.trim() || undefined,
                });
            }),
        );

        revalidatePath(`/dashboard/events/${eventId}`);
        revalidatePath("/dashboard/events");
        revalidatePath(`/events/${event.slug}`);
        revalidatePath("/events");
        revalidatePath("/");

        return { success: true, ordersToRefund: orders.length };
    } catch (error) {
        console.error("Erreur cancelEvent:", error);
        return { error: "Une erreur est survenue lors de l'annulation" };
    }
}
