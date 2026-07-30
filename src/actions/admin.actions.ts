"use server";

import prisma from "@/lib/prisma";
import { isAdmin } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { sendOrganizerRequestDecisionEmail } from "@/lib/email";

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
