"use server";

import { getCurrentUser } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { sendAgentInvitationEmail } from "@/lib/email";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// ─────────────────────────────────────────────
// inviteAgent
// ─────────────────────────────────────────────

export async function inviteAgent(eventId: string, userEmail: string) {
    const caller = await getCurrentUser();
    if (!caller) return { error: "Non authentifié" };

    if (caller.role !== "ORGANIZER" && caller.role !== "ADMIN") {
        return { error: "Accès refusé" };
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return { error: "Évènement introuvable" };

    if (caller.role !== "ADMIN" && event.organizerId !== caller.id) {
        return { error: "Accès refusé" };
    }

    const target = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!target) return { error: "Aucun utilisateur avec cet email" };

    if (target.id === event.organizerId) {
        return { error: "L'organisateur ne peut pas être son propre agent" };
    }

    const existing = await prisma.eventAgent.findUnique({
        where: { eventId_userId: { eventId, userId: target.id } },
    });
    if (existing) return { error: "Cet utilisateur est déjà agent de cet évènement" };

    const token = randomBytes(32).toString("hex");

    await prisma.eventAgent.create({
        data: { eventId, userId: target.id, token },
    });

    const eventDate = format(new Date(event.startDate), "d MMMM yyyy", {
        locale: fr,
    });

    void sendAgentInvitationEmail({
        to: target.email,
        recipientName: target.name ?? target.email,
        eventTitle: event.title,
        eventDate,
        eventLocation: event.location,
        eventType: event.eventType,
        organizerName: caller.name ?? caller.email,
        token,
    }).catch(console.error);

    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
}

// ─────────────────────────────────────────────
// confirmAgent
// ─────────────────────────────────────────────

export async function confirmAgent(token: string) {
    const dbUser = await getCurrentUser();
    if (!dbUser) return { error: "Non authentifié" };

    const agent = await prisma.eventAgent.findUnique({ where: { token } });
    if (!agent) return { error: "Lien invalide ou expiré" };

    if (agent.userId !== dbUser.id) {
        return { error: "Ce lien ne vous appartient pas" };
    }

    if (agent.status === "CONFIRMED") return { alreadyConfirmed: true };
    if (agent.status === "REVOKED") return { error: "Cette invitation a été révoquée" };

    await prisma.eventAgent.update({
        where: { token },
        data: { status: "CONFIRMED" },
    });

    revalidatePath(`/agent/${agent.eventId}/scan`);
    return { success: true, eventId: agent.eventId };
}

// ─────────────────────────────────────────────
// revokeAgent
// ─────────────────────────────────────────────

export async function revokeAgent(eventId: string, targetUserId: string) {
    const caller = await getCurrentUser();
    if (!caller) return { error: "Non authentifié" };

    if (caller.role !== "ORGANIZER" && caller.role !== "ADMIN") {
        return { error: "Accès refusé" };
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return { error: "Évènement introuvable" };

    if (caller.role !== "ADMIN" && event.organizerId !== caller.id) {
        return { error: "Accès refusé" };
    }

    await prisma.eventAgent.update({
        where: { eventId_userId: { eventId, userId: targetUserId } },
        data: { status: "REVOKED" },
    });

    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
}
