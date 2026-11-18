"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { stockConsumingOrderFilter } from "@/lib/stock";
import { MAX_PRINT_BATCH, normalizePrintCode, PRINT_CODE_MAX } from "@/lib/printed-tickets";

/** null si l'utilisateur gère l'évènement, sinon le message d'erreur. */
async function manageError(eventId: string): Promise<string | null> {
    const user = await getCurrentUser();
    if (!user) return "Non authentifié";
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { organizerId: true },
    });
    if (!event) return "Évènement introuvable";
    if (user.role !== "ADMIN" && event.organizerId !== user.id) return "Accès refusé";
    return null;
}

function revalidateEvent(eventId: string) {
    revalidatePath(`/dashboard/events/${eventId}`);
}

// ─────────────────────────────────────────────
// Lots imprimés
// ─────────────────────────────────────────────

/**
 * Crée un lot de billets imprimés : une commande PRINTED avec un billet
 * numéroté par ligne. Le stock du billet est réservé tout de suite.
 */
export async function createPrintBatch(
    eventId: string,
    ticketId: string,
    quantity: number,
): Promise<{ orderId: string; from: number; to: number } | { error: string }> {
    const denied = await manageError(eventId);
    if (denied) return { error: denied };

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_PRINT_BATCH) {
        return { error: `Quantité invalide (1 à ${MAX_PRINT_BATCH} billets par lot).` };
    }

    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true, eventId: true, price: true, totalStock: true, isArchived: true, printCode: true },
    });
    if (!ticket || ticket.eventId !== eventId) return { error: "Billet introuvable" };
    if (ticket.isArchived) return { error: "Ce billet est retiré de la vente." };
    if (!ticket.printCode) {
        return { error: "Choisissez d'abord le code imprimé de ce billet (Codes et visuels)." };
    }

    const reference = `PHY-${randomBytes(5).toString("hex").toUpperCase()}`;

    const result = await prisma.$transaction(async (tx) => {
        // Même verrou que l'achat en ligne : pas de survente entre les deux canaux.
        await tx.$queryRaw`SELECT id FROM "Ticket" WHERE id = ${ticketId} FOR UPDATE`;

        if (ticket.totalStock !== null) {
            const sold = await tx.orderItem.aggregate({
                where: { ticketId, order: stockConsumingOrderFilter() },
                _sum: { quantity: true },
            });
            const remaining = ticket.totalStock - (sold._sum.quantity ?? 0);
            if (remaining < quantity) {
                return {
                    error: remaining > 0
                        ? `Stock insuffisant : ${remaining} billet${remaining > 1 ? "s" : ""} restant${remaining > 1 ? "s" : ""}.`
                        : "Ce billet est épuisé.",
                };
            }
        }

        // Compteur jamais décrémenté : les numéros des invendus annulés ne
        // sont pas réattribués (ils existent encore sur papier).
        const last = await tx.orderItem.aggregate({
            where: { ticketId },
            _max: { serial: true },
        });
        const current = await tx.ticket.findUniqueOrThrow({
            where: { id: ticketId },
            select: { printSerialSeq: true },
        });
        const from = Math.max(current.printSerialSeq, last._max.serial ?? 0) + 1;
        await tx.ticket.update({
            where: { id: ticketId },
            data: { printSerialSeq: from + quantity - 1 },
        });

        const order = await tx.order.create({
            data: {
                reference,
                status: "PRINTED",
                totalAmount: ticket.price * quantity,
                eventId,
                items: {
                    create: Array.from({ length: quantity }, (_, i) => ({
                        quantity: 1,
                        price: ticket.price,
                        ticketId,
                        serial: from + i,
                    })),
                },
            },
            select: { id: true },
        });

        return { orderId: order.id, from, to: from + quantity - 1 };
    });

    if (!("error" in result)) revalidateEvent(eventId);
    return result;
}

/**
 * Annule les billets invendus (non activés, jamais scannés) d'un lot : leurs
 * QR deviennent invalides et le stock est libéré. À faire au bilan, après
 * récupération des billets non vendus.
 */
export async function releaseUnsoldTickets(
    orderId: string,
): Promise<{ released: number } | { error: string }> {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, eventId: true, status: true },
    });
    if (!order || order.status !== "PRINTED") return { error: "Lot introuvable" };

    const denied = await manageError(order.eventId);
    if (denied) return { error: denied };

    const { count } = await prisma.orderItem.deleteMany({
        where: { orderId, activatedAt: null, scannedCount: 0 },
    });

    const left = await prisma.orderItem.count({ where: { orderId } });
    if (left === 0) {
        await prisma.order.delete({ where: { id: orderId } });
    } else {
        const items = await prisma.orderItem.aggregate({
            where: { orderId },
            _sum: { price: true },
        });
        await prisma.order.update({
            where: { id: orderId },
            data: { totalAmount: items._sum.price ?? 0 },
        });
    }

    revalidateEvent(order.eventId);
    return { released: count };
}

// ─────────────────────────────────────────────
// Visuels du graphiste
// ─────────────────────────────────────────────

const ART_MAX_BYTES = 4 * 1024 * 1024;
const ART_TYPES = ["image/png", "image/jpeg"];

/** Enregistre le visuel d'un billet imprimé (recto seul, PNG/JPG 300 dpi). */
export async function uploadPrintArt(formData: FormData) {
    const ticketId = String(formData.get("ticketId") ?? "");
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) return { error: "Aucun fichier" };
    if (!ART_TYPES.includes(file.type)) return { error: "Format accepté : PNG ou JPG." };
    if (file.size > ART_MAX_BYTES) return { error: "Le visuel dépasse 4 Mo (exportez en JPG qualité 90 %)." };

    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true, eventId: true },
    });
    if (!ticket) return { error: "Billet introuvable" };

    const denied = await manageError(ticket.eventId);
    if (denied) return { error: denied };

    const ext = file.type === "image/png" ? "png" : "jpg";
    const blob = await put(`tickets/print/${ticket.id}.${ext}`, file, {
        access: "public",
        addRandomSuffix: true,
    });

    await prisma.ticket.update({
        where: { id: ticket.id },
        data: { printFrontUrl: blob.url },
    });

    revalidateEvent(ticket.eventId);
    return { success: true };
}

/** Revient au design par défaut. */
export async function removePrintArt(ticketId: string) {
    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true, eventId: true },
    });
    if (!ticket) return { error: "Billet introuvable" };

    const denied = await manageError(ticket.eventId);
    if (denied) return { error: denied };

    await prisma.ticket.update({
        where: { id: ticket.id },
        data: { printFrontUrl: null },
    });

    revalidateEvent(ticket.eventId);
    return { success: true };
}

/**
 * Code imprimé devant le numéro (ex. STD-1J → STD-1J-0001). Unique dans
 * l'évènement, et figé dès qu'un lot a été imprimé pour ce billet : les
 * numéros papier ne doivent pas changer.
 */
export async function setPrintCode(ticketId: string, input: string) {
    const code = normalizePrintCode(input);
    if (!code) {
        return { error: `Code invalide : 1 à ${PRINT_CODE_MAX} caractères, lettres, chiffres et tirets.` };
    }

    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true, eventId: true, printCode: true, printSerialSeq: true },
    });
    if (!ticket) return { error: "Billet introuvable" };

    const denied = await manageError(ticket.eventId);
    if (denied) return { error: denied };

    if (ticket.printCode === code) return { success: true, code };

    const printed =
        ticket.printSerialSeq > 0 ||
        (await prisma.orderItem.count({ where: { ticketId, serial: { not: null } } })) > 0;
    if (printed) {
        return { error: "Des billets ont déjà été imprimés avec ce code : il ne peut plus changer." };
    }

    const taken = await prisma.ticket.findFirst({
        where: { eventId: ticket.eventId, printCode: code, id: { not: ticket.id } },
        select: { title: true },
    });
    if (taken) return { error: `Le code ${code} est déjà utilisé par « ${taken.title} ».` };

    await prisma.ticket.update({ where: { id: ticket.id }, data: { printCode: code } });

    revalidateEvent(ticket.eventId);
    return { success: true, code };
}

/** Couleur du numéro imprimé, selon le fond du visuel (noir ou blanc). */
export async function setPrintNumberColor(ticketId: string, color: "dark" | "light") {
    if (color !== "dark" && color !== "light") return { error: "Couleur invalide" };

    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true, eventId: true },
    });
    if (!ticket) return { error: "Billet introuvable" };

    const denied = await manageError(ticket.eventId);
    if (denied) return { error: denied };

    await prisma.ticket.update({
        where: { id: ticket.id },
        data: { printNumberColor: color },
    });

    revalidateEvent(ticket.eventId);
    return { success: true };
}
