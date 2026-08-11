"use server";

import prisma from "@/lib/prisma";
import { isAdmin } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { sendOrganizerRequestDecisionEmail, sendPartnerRequestDecisionEmail } from "@/lib/email";

export async function processOrganizerRequest(
    requestId: string,
    status: "APPROVED" | "REJECTED",
) {
    if (!(await isAdmin())) return { error: "Accès non autorisé" };

    try {
        const request = await prisma.organizerRequest.findUnique({
            where: { id: requestId },
            include: { user: true },
        });

        if (!request) return { error: "Demande introuvable" };
        if (request.status !== "PENDING")
            return { error: "Demande déjà traitée" };

        await prisma.organizerRequest.update({
            where: { id: requestId },
            data: { status },
        });

        if (status === "APPROVED") {
            await prisma.user.update({
                where: { id: request.userId },
                data: { role: "ORGANIZER" },
            });
        }

        const settings = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });

        sendOrganizerRequestDecisionEmail({
            to: request.user.email,
            applicantName: request.user.name ?? request.organizerName,
            status,
            commissionRate: settings?.commissionRate ?? 0,
            eventCreationFeeEnabled: settings?.eventCreationFeeEnabled ?? false,
            eventCreationFee: settings?.eventCreationFee ?? 5000,
            featuredEventFeeEnabled: settings?.featuredEventFeeEnabled ?? false,
            featuredEventFee: settings?.featuredEventFee ?? 5000,
        }).catch((err) =>
            console.error("Organizer decision email error:", err),
        );

        revalidatePath("/admin/requests");
        return { success: true, message: "Demande traitée avec succès" };
    } catch (error) {
        console.error("Erreur processOrganizerRequest", error);
        return { error: "Erreur serveur" };
    }
}

// ─────────────────────────────────────────────
// processPartnerRequest — approbation/refus d'une candidature partenaire.
// À l'approbation, l'admin fixe le taux de commission négocié.
// ─────────────────────────────────────────────

export async function processPartnerRequest(
    requestId: string,
    status: "APPROVED" | "REJECTED",
    commissionRate?: number,
) {
    if (!(await isAdmin())) return { error: "Accès non autorisé" };

    if (status === "APPROVED") {
        if (
            commissionRate === undefined ||
            Number.isNaN(commissionRate) ||
            commissionRate < 0 ||
            commissionRate > 100
        ) {
            return { error: "Taux de commission invalide (0 à 100)." };
        }
    }

    try {
        const request = await prisma.partnerRequest.findUnique({
            where: { id: requestId },
            include: { applicant: true },
        });

        if (!request) return { error: "Candidature introuvable" };
        if (request.status !== "PENDING")
            return { error: "Candidature déjà traitée" };

        await prisma.partnerRequest.update({
            where: { id: requestId },
            data: { status },
        });

        if (status === "APPROVED") {
            await prisma.user.update({
                where: { id: request.applicantId },
                data: {
                    partnerCommissionRate: commissionRate,
                    // Un partenaire a nécessairement les droits organisateur
                    role: request.applicant.role === "ADMIN" ? "ADMIN" : "ORGANIZER",
                },
            });
        }

        const settings = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });

        sendPartnerRequestDecisionEmail({
            to: request.applicant.email,
            applicantName: request.applicant.name ?? request.organizationName,
            status,
            commissionRate,
            standardCommissionRate: settings?.commissionRate ?? 0,
            eventCreationFeeEnabled: settings?.eventCreationFeeEnabled ?? false,
            eventCreationFee: settings?.eventCreationFee ?? 5000,
            featuredEventFeeEnabled: settings?.featuredEventFeeEnabled ?? false,
            featuredEventFee: settings?.featuredEventFee ?? 5000,
        }).catch((err) =>
            console.error("Partner decision email error:", err),
        );

        revalidatePath("/admin/partner-requests");
        return { success: true, message: "Candidature traitée avec succès" };
    } catch (error) {
        console.error("Erreur processPartnerRequest", error);
        return { error: "Erreur serveur" };
    }
}
