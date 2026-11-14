"use server";

import { getCurrentUser } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { parseDayKeys } from "@/lib/ticket-days";

// ─────────────────────────────────────────────
// Schémas partagés
// ─────────────────────────────────────────────

const ticketBaseSchema = z.object({
    title: z.string().min(2, "Le titre du billet est trop court"),
    description: z.string().optional(),
    price: z
        .string()
        .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
            message: "Prix invalide",
        }),
    totalStock: z
        .string()
        .optional()
        .refine((val) => !val || (!isNaN(parseInt(val)) && parseInt(val) > 0), {
            message: "Stock invalide",
        }),
    emailTemplate: z.enum(["PRIMARY", "SECONDARY"]).default("PRIMARY"),
});

const createTicketSchema = ticketBaseSchema.extend({
    eventId: z.string().min(1, "L'ID de l'évènement est requis"),
});

const updateTicketSchema = ticketBaseSchema.extend({
    ticketId: z.string().min(1, "L'ID du billet est requis"),
});

/**
 * Lit les champs « accès » d'un formulaire : jours de validité et sessions
 * (ex. conférences) auxquelles le billet donne accès. Les sessions doivent
 * appartenir à l'évènement du billet.
 */
async function parseAccessFields(
    formData: FormData,
    eventId: string,
): Promise<{ validDays: string[]; sessionIds: string[] } | { error: string }> {
    const validDays = parseDayKeys(
        formData.getAll("validDays").map((v) => String(v)),
    );
    if (!validDays) return { error: "Jour de validité invalide." };

    const sessionIds = [
        ...new Set(formData.getAll("sessionIds").map((v) => String(v)).filter(Boolean)),
    ];
    if (sessionIds.length > 0) {
        const found = await prisma.eventSession.count({
            where: { id: { in: sessionIds }, eventId },
        });
        if (found !== sessionIds.length) return { error: "Session introuvable." };
    }
    return { validDays, sessionIds };
}

export async function createTicket(formData: FormData) {
    try {
        const dbUser = await getCurrentUser();

        if (
            !dbUser ||
            (dbUser.role !== "ORGANIZER" && dbUser.role !== "ADMIN")
        ) {
            return { error: "Permission refusée." };
        }

        const eventId = formData.get("eventId") as string;

        // Vérifier que l'évènement appartient bien à cet utilisateur (ou ADMIN)
        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) return { error: "Évènement introuvable." };
        if (dbUser.role !== "ADMIN" && event.organizerId !== dbUser.id) {
            return {
                error: "Vous n'êtes pas le propriétaire de cet évènement.",
            };
        }

        // Valider les données
        const parsedData = createTicketSchema.safeParse({
            eventId,
            title: formData.get("title"),
            description: formData.get("description"),
            price: formData.get("price"),
            totalStock: formData.get("totalStock"),
            emailTemplate: formData.get("emailTemplate") ?? "PRIMARY",
        });

        if (!parsedData.success) {
            const errorMessage =
                parsedData.error.issues?.[0]?.message || "Données invalides";
            return { error: errorMessage };
        }

        const data = parsedData.data;

        const access = await parseAccessFields(formData, event.id);
        if ("error" in access) return { error: access.error };

        // Gérer l'upload de l'image du ticket
        const imageFile = formData.get("image") as File | null;
        if (imageFile && imageFile.size > 1024 * 1024) {
            return { error: "L'image du billet dépasse 1 Mo." };
        }

        let imageUrl: string | null = null;
        if (imageFile && imageFile.size > 0) {
            const blob = await put(
                `tickets/${event.slug}-${imageFile.name}`,
                imageFile,
                {
                    access: "public",
                },
            );
            imageUrl = blob.url;
        }

        // Créer le ticket
        await prisma.ticket.create({
            data: {
                title: data.title,
                description: data.description || undefined,
                price: parseFloat(data.price),
                totalStock: data.totalStock ? parseInt(data.totalStock) : null,
                imageUrl,
                emailTemplate: data.emailTemplate,
                validDays: access.validDays,
                sessions: {
                    create: access.sessionIds.map((sessionId) => ({ sessionId })),
                },
                eventId: event.id,
            },
        });

        revalidatePath(`/dashboard/events/${event.id}`);
        revalidatePath(`/events/${event.slug}`);

        return { success: true };
    } catch (error) {
        console.error("Erreur createTicket:", error);
        return {
            error: "Une erreur est survenue lors de la création du billet.",
        };
    }
}

// ─────────────────────────────────────────────
// updateTicket
// ─────────────────────────────────────────────

export async function updateTicket(formData: FormData) {
    try {
        const dbUser = await getCurrentUser();
        if (
            !dbUser ||
            (dbUser.role !== "ORGANIZER" && dbUser.role !== "ADMIN")
        ) {
            return { error: "Permission refusée." };
        }

        const ticketId = formData.get("ticketId") as string;

        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { event: true },
        });
        if (!ticket) return { error: "Billet introuvable." };
        if (dbUser.role !== "ADMIN" && ticket.event.organizerId !== dbUser.id) {
            return { error: "Vous n'êtes pas le propriétaire de ce billet." };
        }

        const parsedData = updateTicketSchema.safeParse({
            ticketId,
            title: formData.get("title"),
            description: formData.get("description") || undefined,
            price: formData.get("price"),
            totalStock: formData.get("totalStock") || undefined,
            emailTemplate: formData.get("emailTemplate") ?? "PRIMARY",
        });

        if (!parsedData.success) {
            return {
                error:
                    parsedData.error.issues[0]?.message || "Données invalides",
            };
        }

        const data = parsedData.data;

        const access = await parseAccessFields(formData, ticket.event.id);
        if ("error" in access) return { error: access.error };

        // Image optionnelle — on garde l'existante si aucun nouveau fichier
        const imageFile = formData.get("image") as File | null;
        if (imageFile && imageFile.size > 1024 * 1024) {
            return { error: "L'image du billet dépasse 1 Mo." };
        }

        let imageUrl: string | null = ticket.imageUrl;
        if (imageFile && imageFile.size > 0) {
            const blob = await put(
                `tickets/${ticket.event.slug}-${Date.now()}-${imageFile.name}`,
                imageFile,
                { access: "public" },
            );
            imageUrl = blob.url;
        }

        await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                title: data.title,
                description: data.description || null,
                price: parseFloat(data.price),
                totalStock: data.totalStock ? parseInt(data.totalStock) : null,
                imageUrl,
                emailTemplate: data.emailTemplate,
                validDays: access.validDays,
                // Remplace l'ensemble des accès aux sessions.
                sessions: {
                    deleteMany: {},
                    create: access.sessionIds.map((sessionId) => ({ sessionId })),
                },
            },
        });

        revalidatePath(`/dashboard/events/${ticket.event.id}`);
        revalidatePath(`/events/${ticket.event.slug}`);

        return { success: true };
    } catch (error) {
        console.error("Erreur updateTicket:", error);
        return { error: "Erreur interne lors de la mise à jour du billet." };
    }
}

// ─────────────────────────────────────────────
// deleteTicket
// ─────────────────────────────────────────────

export async function deleteTicket(ticketId: string) {
    try {
        const dbUser = await getCurrentUser();
        if (
            !dbUser ||
            (dbUser.role !== "ORGANIZER" && dbUser.role !== "ADMIN")
        ) {
            return { error: "Permission refusée." };
        }

        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { event: true },
        });
        if (!ticket) return { error: "Billet introuvable." };
        if (dbUser.role !== "ADMIN" && ticket.event.organizerId !== dbUser.id) {
            return { error: "Vous n'êtes pas le propriétaire de ce billet." };
        }

        await prisma.ticket.delete({ where: { id: ticketId } });

        revalidatePath(`/dashboard/events/${ticket.event.id}`);
        revalidatePath(`/events/${ticket.event.slug}`);

        return { success: true };
    } catch (error) {
        console.error("Erreur deleteTicket:", error);
        return { error: "Erreur interne lors de la suppression du billet." };
    }
}
