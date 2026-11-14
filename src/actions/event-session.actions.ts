"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { eventDayKeys } from "@/lib/ticket-days";

/**
 * Sessions à accès restreint d'un évènement (ex. « Conférences » du 18 déc.).
 * Gérées par l'organisateur de l'évènement ou un administrateur.
 */

async function canManageEvent(eventId: string) {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ORGANIZER" && user.role !== "ADMIN")) return null;
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, organizerId: true, startDate: true, endDate: true },
    });
    if (!event) return null;
    if (user.role !== "ADMIN" && event.organizerId !== user.id) return null;
    return event;
}

export async function createEventSession(formData: FormData) {
    const eventId = String(formData.get("eventId") ?? "");
    const event = await canManageEvent(eventId);
    if (!event) return { error: "Permission refusée." };

    const name = String(formData.get("name") ?? "").trim();
    const day = String(formData.get("day") ?? "");
    const rawCapacity = String(formData.get("capacity") ?? "").trim();

    if (name.length < 2 || name.length > 80) {
        return { error: "Donnez un nom à la session (2 à 80 caractères)." };
    }
    if (!eventDayKeys(event.startDate, event.endDate).includes(day)) {
        return { error: "Choisissez un jour de l'évènement." };
    }
    let capacity: number | null = null;
    if (rawCapacity) {
        capacity = Number(rawCapacity);
        if (!Number.isInteger(capacity) || capacity < 1) {
            return { error: "La capacité doit être un nombre entier positif." };
        }
    }

    await prisma.eventSession.create({
        data: { eventId, name, day, capacity },
    });
    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
}

export async function deleteEventSession(sessionId: string) {
    const session = await prisma.eventSession.findUnique({
        where: { id: sessionId },
        select: { eventId: true },
    });
    if (!session) return { error: "Session introuvable." };
    if (!(await canManageEvent(session.eventId))) return { error: "Permission refusée." };

    // Les accès des billets (TicketSession) partent en cascade ; les scans
    // déjà enregistrés restent dans l'historique.
    await prisma.eventSession.delete({ where: { id: sessionId } });
    revalidatePath(`/dashboard/events/${session.eventId}`);
    return { success: true };
}
