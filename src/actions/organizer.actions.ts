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
        const organizerEmail = (formData.get("organizerEmail") as string) || null;
        const phoneNumber = formData.get("phoneNumber") as string;
        const address = formData.get("address") as string;
        const description = formData.get("description") as string;

        const newRequest = await prisma.organizerRequest.create({
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
                organizerEmail: string | null;
                phoneNumber: string;
                address: string;
                description: string;
            },
        });

        // Récupérer les admins pour les notifier
        const admins = await prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { email: true },
        });

        const adminEmails = admins.map(a => a.email).filter(Boolean) as string[];

        if (adminEmails.length > 0 && process.env.RESEND_API_KEY) {
            try {
                const { Resend } = await import("resend");
                const resend = new Resend(process.env.RESEND_API_KEY);
                
                await resend.emails.send({
                    from: "Benin Events <no-reply@beninevents.com>",
                    to: adminEmails,
                    subject: "Nouvelle demande d'organisateur - Benin Events",
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #000;">Nouvelle demande d'organisateur</h2>
                            <p>Une nouvelle demande pour devenir organisateur vient d'être soumise sur Benin Events.</p>
                            
                            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 5px 0;"><strong>Demandeur :</strong> ${dbUser.name || 'Non renseigné'} (${dbUser.email})</p>
                                <p style="margin: 5px 0;"><strong>Nom d'organisateur :</strong> ${organizerName}</p>
                                <p style="margin: 5px 0;"><strong>Email organisateur :</strong> ${organizerEmail || dbUser.email}</p>
                                <p style="margin: 5px 0;"><strong>Téléphone :</strong> ${phoneNumber}</p>
                                <p style="margin: 5px 0;"><strong>Adresse :</strong> ${address}</p>
                                <p style="margin: 5px 0;"><strong>Description :</strong> ${description}</p>
                            </div>

                            <p>Veuillez vous connecter à l'espace d'administration pour l'approuver ou la refuser.</p>
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/requests" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 10px;">
                                Voir les demandes
                            </a>
                        </div>
                    `,
                });
            } catch (emailError) {
                console.error("Erreur d'envoi d'email admin:", emailError);
            }
        }

        revalidatePath("/dashboard");
        return { success: true, message: "Demande envoyée avec succès !" };
    } catch (error) {
        console.error("Erreur createOrganizerRequest", error);
        return { error: "Une erreur est survenue lors de la soumission" };
    }
}
