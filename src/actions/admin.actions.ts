"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

// Vous devrez rajouter RESEND_API_KEY dans votre .env
const resend = new Resend(process.env.RESEND_API_KEY);

async function checkAdmin() {
    const user = await currentUser();
    if (!user) return false;

    const dbUser = await prisma.user.findUnique({
        where: { clerkId: user.id },
    });
    return dbUser?.role === "ADMIN";
}

export async function processOrganizerRequest(
    requestId: string,
    status: "APPROVED" | "REJECTED",
) {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return { error: "Accès non autorisé" };

    try {
        const request = await prisma.organizerRequest.findUnique({
            where: { id: requestId },
            include: { user: true },
        });

        if (!request) return { error: "Demande introuvable" };
        if (request.status !== "PENDING")
            return { error: "Demande déjà traitée" };

        // Mettre à jour la requête
        await prisma.organizerRequest.update({
            where: { id: requestId },
            data: { status },
        });

        // Si approuvé, on passe le user en ORGANIZER
        if (status === "APPROVED") {
            await prisma.user.update({
                where: { id: request.userId },
                data: { role: "ORGANIZER" },
            });
        }

        // Envoi de l'email avec Resend
        const subject =
            status === "APPROVED"
                ? "Votre demande d'organisateur a été acceptée !"
                : "Votre demande d'organisateur a été refusée";

        const message =
            status === "APPROVED"
                ? "Félicitations ! Vous pouvez désormais créer et gérer des évènements sur Benin Events."
                : "Malheureusement, votre demande pour devenir organisateur n'a pas été retenue pour le moment.";

        if (process.env.RESEND_API_KEY) {
            await resend.emails.send({
                from: "Benin Events <no-reply@beninevents.com>", // Il faut un domaine vérifié sur Resend
                to: request.user.email,
                subject: subject,
                html: `<p>Bonjour,</p><p>${message}</p>`,
            });
        } else {
            console.warn(
                "L'email n'a pas été envoyé car RESEND_API_KEY est manquant.",
            );
        }

        revalidatePath("/admin/requests");
        return { success: true, message: "Demande traitée avec succès" };
    } catch (error) {
        console.error("Erreur processOrganizerRequest", error);
        return { error: "Erreur serveur" };
    }
}
