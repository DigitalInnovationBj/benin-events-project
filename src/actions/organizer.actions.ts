"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { sendOrganizerRequestAdminEmail } from "@/lib/email";

export async function createOrganizerRequest(formData: FormData) {
    const user = await currentUser();
    if (!user) return { error: "Non authentifié" };

    try {
        const dbUser = await prisma.user.findUnique({
            where: { clerkId: user.id },
            include: { organizerRequests: true },
        });

        if (!dbUser) return { error: "Utilisateur introuvable en base de données" };

        const hasPendingRequest = dbUser.organizerRequests.some(
            (r) => r.status === "PENDING",
        );
        if (hasPendingRequest) {
            return { error: "Vous avez déjà une demande en attente." };
        }

        if (dbUser.role === "ORGANIZER" || dbUser.role === "ADMIN") {
            return { error: "Vous êtes déjà un organisateur ou administrateur." };
        }

        const organizerName = formData.get("organizerName") as string;
        const organizerEmail =
            (formData.get("organizerEmail") as string) || dbUser.email;
        const phoneNumber = formData.get("phoneNumber") as string;
        const address = formData.get("address") as string;
        const description = (formData.get("description") as string) || undefined;

        await prisma.organizerRequest.create({
            data: {
                userId: dbUser.id,
                organizerName,
                organizerEmail,
                phoneNumber,
                address,
                description,
            } as {
                userId: string;
                organizerName: string;
                organizerEmail: string;
                phoneNumber: string;
                address: string;
                description?: string;
            },
        });

        // Notification email aux admins
        const admins = await prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { email: true },
        });

        const adminEmails = admins.map((a) => a.email);

        if (adminEmails.length > 0) {
            sendOrganizerRequestAdminEmail({
                adminEmails,
                applicantName: dbUser.name ?? "Utilisateur",
                applicantEmail: dbUser.email,
                organizerName,
                organizerEmail,
                phoneNumber,
                address,
                description,
            }).catch((err) =>
                console.error("Organizer request admin email error:", err),
            );
        }

        revalidatePath("/dashboard");
        return { success: true, message: "Demande envoyée avec succès !" };
    } catch (error) {
        console.error("Erreur createOrganizerRequest", error);
        return { error: "Une erreur est survenue lors de la soumission" };
    }
}
