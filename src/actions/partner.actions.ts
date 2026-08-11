"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { sendPartnerRequestAdminEmail } from "@/lib/email";

export async function createPartnerRequest(formData: FormData) {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) return { error: "Non authentifié" };

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: sessionUser.id },
            include: { partnerRequests: true },
        });

        if (!dbUser) return { error: "Utilisateur introuvable en base de données" };

        const hasPendingRequest = dbUser.partnerRequests.some(
            (r) => r.status === "PENDING",
        );
        if (hasPendingRequest) {
            return { error: "Vous avez déjà une candidature en attente." };
        }

        if (dbUser.partnerCommissionRate !== null) {
            return { error: "Vous êtes déjà partenaire Benin Events." };
        }

        const organizationName = formData.get("organizationName") as string;
        const sector = formData.get("sector") as string;
        const estimatedEventsPerYear = Number(
            formData.get("estimatedEventsPerYear"),
        );
        const message = (formData.get("message") as string) || undefined;

        await prisma.partnerRequest.create({
            data: {
                applicantId: dbUser.id,
                organizationName,
                sector,
                estimatedEventsPerYear,
                message,
            },
        });

        const admins = await prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { email: true },
        });
        const adminEmails = admins.map((a) => a.email);

        if (adminEmails.length > 0) {
            sendPartnerRequestAdminEmail({
                adminEmails,
                applicantName: dbUser.name ?? "Utilisateur",
                applicantEmail: dbUser.email,
                organizationName,
                sector,
                estimatedEventsPerYear,
                message,
            }).catch((err) =>
                console.error("Partner request admin email error:", err),
            );
        }

        revalidatePath("/dashboard");
        return { success: true, message: "Candidature envoyée avec succès !" };
    } catch (error) {
        console.error("Erreur createPartnerRequest", error);
        return { error: "Une erreur est survenue lors de la soumission" };
    }
}
