"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Helper function to create a slug from title
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

const createEventSchema = z.object({
    title: z.string().min(3, "Le titre est trop court"),
    description: z.string().min(10, "La description est trop courte"),
    location: z.string().min(2, "Lieu requis"),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Date de début invalide",
    }),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Date de fin invalide",
    }),
    ogTitle: z.string().optional(),
});

export async function createEvent(formData: FormData) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { error: "Non autorisé" };
        }

        // Vérifier si l'utilisateur est ORGANIZER ou ADMIN dans notre DB
        const dbUser = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (
            !dbUser ||
            (dbUser.role !== "ORGANIZER" && dbUser.role !== "ADMIN")
        ) {
            return {
                error: "Permission refusée. Vous devez être organisateur.",
            };
        }

        // Valider les données basiques
        const parsedData = createEventSchema.safeParse({
            title: formData.get("title"),
            description: formData.get("description"),
            location: formData.get("location"),
            startDate: formData.get("startDate"),
            endDate: formData.get("endDate"),
            ogTitle: formData.get("ogTitle") || undefined,
        });

        if (!parsedData.success) {
            const errorMessage = parsedData.error.issues?.[0]?.message || "Données invalides";
            return { error: errorMessage };
        }

        const data = parsedData.data;

        // Générer un slug unique
        let slug = generateSlug(data.title);
        let count = 1;
        while (await prisma.event.findUnique({ where: { slug } })) {
            slug = `${generateSlug(data.title)}-${count}`;
            count++;
        }

        // Gérer l'upload de l'image (Event Image)
        const imageFile = formData.get("image") as File | null;
        if (imageFile && imageFile.size > 1024 * 1024) {
            return { error: "L'image de l'évènement dépasse 1 Mo." };
        }
        
        let imageUrl: string | null = null;
        if (imageFile && imageFile.size > 0) {
            const blob = await put(
                `events/${slug}-${imageFile.name}`,
                imageFile,
                {
                    access: "public",
                },
            );
            imageUrl = blob.url;
        }

        // Gérer l'upload de l'image OG (si fournie, sinon on utilise l'image principale)
        const ogImageFile = formData.get("ogImage") as File | null;
        if (ogImageFile && ogImageFile.size > 1024 * 1024) {
            return { error: "L'image de partage dépasse 1 Mo." };
        }

        let ogImageUrl: string | null = imageUrl;
        if (ogImageFile && ogImageFile.size > 0) {
            const blob = await put(
                `events/og-${slug}-${ogImageFile.name}`,
                ogImageFile,
                {
                    access: "public",
                },
            );
            ogImageUrl = blob.url;
        }

        // Créer l'évènement dans la DB
        const event = await prisma.event.create({
            data: {
                title: data.title,
                slug,
                description: data.description,
                location: data.location,
                startDate: parseBeninLocalDate(data.startDate),
                endDate: parseBeninLocalDate(data.endDate),
                imageUrl,
                ogTitle: data.ogTitle || data.title,
                ogImage: ogImageUrl,
                organizerId: dbUser.id,
            },
        });

        revalidatePath("/dashboard/events");
        revalidatePath("/");

        return { success: true, eventId: event.id, slug: event.slug };
    } catch (error) {
        console.error("Erreur createEvent:", error);
        return {
            error: "Une erreur interne s'est produite lors de la création de l'évènement.",
        };
    }
}
