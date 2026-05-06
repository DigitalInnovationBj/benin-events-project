"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { sendOrganizerRequestDecisionEmail } from "@/lib/email";

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

        sendOrganizerRequestDecisionEmail({
            to: request.user.email,
            applicantName: request.user.name ?? request.organizerName,
            status,
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
