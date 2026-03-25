"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const createTicketSchema = z.object({
    eventId: z.string().min(1, "L'ID de l'évènement est requis"),
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
});

export async function createTicket(formData: FormData) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { error: "Non autorisé" };
        }

        const dbUser = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

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
        });

        if (!parsedData.success) {
            const errorMessage = parsedData.error.issues?.[0]?.message || "Données invalides";
            return { error: errorMessage };
        }

        const data = parsedData.data;

        // Gérer l'upload de l'image du ticket
        const imageFile = formData.get("image") as File | null;
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
