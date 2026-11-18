import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

/**
 * Durée pendant laquelle une commande PENDING réserve du stock.
 *
 * Un push Mobile Money FeexPay se résout en quelques minutes (USSD) : au-delà,
 * la commande est considérée comme abandonnée et ses places sont relibérées.
 * Le cron de réconciliation les passera en EXPIRED.
 */
export const PENDING_HOLD_MINUTES = 20;

/**
 * Clause `where` sur `OrderItem` comptant les billets qui consomment réellement
 * du stock : les commandes payées, plus les commandes en attente encore dans
 * leur fenêtre de réservation.
 *
 * Source de vérité unique — utilisée par l'affichage (page évènement) et par la
 * vérification transactionnelle (initiateTicketPayment), afin que le nombre de
 * places annoncé à l'acheteur soit exactement celui que le serveur applique.
 */
export function stockConsumingOrderFilter(
    now: Date = new Date(),
): Prisma.OrderWhereInput {
    const pendingCutoff = new Date(
        now.getTime() - PENDING_HOLD_MINUTES * 60 * 1000,
    );

    return {
        OR: [
            { status: "COMPLETED" },
            // Billets imprimés : réservés dès l'export, vendus ou non.
            { status: "PRINTED" },
            { status: "PENDING", createdAt: { gte: pendingCutoff } },
        ],
    };
}

/**
 * Nombre de places restantes pour chaque billet demandé.
 *
 * Les billets à stock illimité (`totalStock === null`) sont renvoyés avec la
 * valeur `null`. Les billets introuvables sont absents de la Map.
 */
export async function getRemainingStock(
    ticketIds: string[],
): Promise<Map<string, number | null>> {
    const remaining = new Map<string, number | null>();
    if (ticketIds.length === 0) return remaining;

    const tickets = await prisma.ticket.findMany({
        where: { id: { in: ticketIds } },
        select: { id: true, totalStock: true },
    });

    const limited = tickets.filter((t) => t.totalStock !== null);

    // Les billets illimités n'ont pas besoin d'agrégat.
    for (const ticket of tickets) {
        if (ticket.totalStock === null) remaining.set(ticket.id, null);
    }

    if (limited.length === 0) return remaining;

    const sold = await prisma.orderItem.groupBy({
        by: ["ticketId"],
        where: {
            ticketId: { in: limited.map((t) => t.id) },
            order: stockConsumingOrderFilter(),
        },
        _sum: { quantity: true },
    });

    const soldMap = new Map(sold.map((s) => [s.ticketId, s._sum.quantity ?? 0]));

    for (const ticket of limited) {
        remaining.set(
            ticket.id,
            Math.max(0, ticket.totalStock! - (soldMap.get(ticket.id) ?? 0)),
        );
    }

    return remaining;
}
