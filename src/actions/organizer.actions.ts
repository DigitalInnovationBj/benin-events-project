"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function createOrganizerRequest(formData: FormData) {
    const user = await currentUser();

    if (!user) {
        return { error: "Non authentifié" };
    }

    try {
        const dbUser = await prisma.user.findUnique({
            where: { clerkId: user.id },
            include: { organizerRequests: true },
        });

        if (!dbUser) {
            return { error: "Utilisateur introuvable en base de données" };
        }

        // Vérifier si l'utilisateur a déjà une demande en attente ou s'il est déjà organisateur
        const hasPendingRequest = dbUser.organizerRequests.some(
            (r) => r.status === "PENDING",
        );
        if (hasPendingRequest) {
            return { error: "Vous avez déjà une demande en attente." };
        }

        if (dbUser.role === "ORGANIZER" || dbUser.role === "ADMIN") {
            return {
                error: "Vous êtes déjà un organisateur ou administrateur.",
            };
        }

        const organizerName = formData.get("organizerName") as string;
        const phoneNumber = formData.get("phoneNumber") as string;
        const address = formData.get("address") as string;
        const description = formData.get("description") as string;

        await prisma.organizerRequest.create({
            data: {
                userId: dbUser.id,
                organizerName,
                phoneNumber,
                address,
                description,
            },
        });

        revalidatePath("/dashboard");
        return { success: true, message: "Demande envoyée avec succès !" };
    } catch (error) {
        console.error("Erreur createOrganizerRequest", error);
        return { error: "Une erreur est survenue lors de la soumission" };
    }
}
