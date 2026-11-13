import prisma from "@/lib/prisma";
import { stockConsumingOrderFilter, PENDING_HOLD_MINUTES } from "@/lib/stock";
import { dayKey, eventDayKeys } from "@/lib/ticket-days";

/**
 * Statistiques du tableau de bord organisateur.
 *
 * Regroupées ici pour que l'accueil, les onglets d'un évènement et le guide
 * lisent les mêmes chiffres de la même façon.
 */

// ─────────────────────────────────────────────
// Ventes par billet
// ─────────────────────────────────────────────

export type TicketSales = {
    id: string;
    title: string;
    price: number;
    totalStock: number | null;
    validDays: string[];
    alsoValidForEventId: string | null;
    sold: number;
    revenue: number;
};

/** Billets vendus (commandes payées) et revenu, par catégorie de billet. */
export async function getTicketSales(eventId: string): Promise<TicketSales[]> {
    const tickets = await prisma.ticket.findMany({
        where: { eventId },
        select: {
            id: true,
            title: true,
            price: true,
            totalStock: true,
            validDays: true,
            alsoValidForEventId: true,
        },
        orderBy: { price: "asc" },
    });
    if (tickets.length === 0) return [];

    const grouped = await prisma.orderItem.groupBy({
        by: ["ticketId"],
        where: {
            ticketId: { in: tickets.map((t) => t.id) },
            order: { status: "COMPLETED" },
        },
        _sum: { quantity: true },
    });
    const soldById = new Map(
        grouped.map((g) => [g.ticketId, g._sum.quantity ?? 0]),
    );

    return tickets.map((t) => {
        const sold = soldById.get(t.id) ?? 0;
        return { ...t, sold, revenue: sold * t.price };
    });
}

// ─────────────────────────────────────────────
// Entrées (scans) par jour
// ─────────────────────────────────────────────

export type EntriesByDay = {
    /** Jours de l'évènement, « YYYY-MM-DD ». */
    days: string[];
    /** Entrées validées par jour. */
    countByDay: Record<string, number>;
    /** Entrées validées aujourd'hui, par billet. */
    todayByTicket: Record<string, number>;
    /** Billets d'un autre évènement donnant accès ici (ex. pass VVIP). */
    extraAccess: { id: string; title: string; eventTitle: string; sold: number }[];
    today: string;
};

/**
 * Entrées d'un évènement jour par jour.
 *
 * Deux sources : les billets classiques comptent leur premier scan
 * (`firstScannedAt`), les pass multi-jours une ligne `TicketScan` par jour et
 * par évènement scanné.
 */
export async function getEntriesByDay(event: {
    id: string;
    startDate: Date;
    endDate: Date;
}): Promise<EntriesByDay> {
    const days = eventDayKeys(event.startDate, event.endDate);
    const today = dayKey();
    const countByDay: Record<string, number> = Object.fromEntries(
        days.map((d) => [d, 0]),
    );
    const todayByTicket: Record<string, number> = {};

    const bump = (day: string, ticketId: string) => {
        countByDay[day] = (countByDay[day] ?? 0) + 1;
        if (day === today) {
            todayByTicket[ticketId] = (todayByTicket[ticketId] ?? 0) + 1;
        }
    };

    const [singleScans, multiScans, extraTickets] = await Promise.all([
        prisma.orderItem.findMany({
            where: {
                firstScannedAt: { not: null },
                order: { status: "COMPLETED" },
                ticket: { eventId: event.id, validDays: { isEmpty: true } },
            },
            select: { ticketId: true, firstScannedAt: true },
        }),
        prisma.ticketScan.findMany({
            where: { eventId: event.id },
            select: { day: true, orderItem: { select: { ticketId: true } } },
        }),
        prisma.ticket.findMany({
            where: { alsoValidForEventId: event.id },
            select: { id: true, title: true, event: { select: { title: true } } },
        }),
    ]);

    for (const s of singleScans) bump(dayKey(s.firstScannedAt!), s.ticketId);
    for (const s of multiScans) bump(s.day, s.orderItem.ticketId);

    let extraAccess: EntriesByDay["extraAccess"] = [];
    if (extraTickets.length > 0) {
        const grouped = await prisma.orderItem.groupBy({
            by: ["ticketId"],
            where: {
                ticketId: { in: extraTickets.map((t) => t.id) },
                order: { status: "COMPLETED" },
            },
            _sum: { quantity: true },
        });
        const soldById = new Map(
            grouped.map((g) => [g.ticketId, g._sum.quantity ?? 0]),
        );
        extraAccess = extraTickets.map((t) => ({
            id: t.id,
            title: t.title,
            eventTitle: t.event.title,
            sold: soldById.get(t.id) ?? 0,
        }));
    }

    return { days, countByDay, todayByTicket, extraAccess, today };
}

// ─────────────────────────────────────────────
// Points à traiter
// ─────────────────────────────────────────────

export type ActionItems = {
    pendingPayments: number;
    undeliveredOrders: number;
    eventsWithoutAgents: { id: string; title: string }[];
};

/**
 * Ce qui demande l'attention de l'organisateur : paiements en cours, billets
 * non délivrés, évènements à venir sans agent de contrôle.
 */
export async function getActionItems(organizerId: string): Promise<ActionItems> {
    const now = new Date();
    // Une commande payée depuis plus de 10 min sans email délivré est en échec.
    const sendGrace = new Date(now.getTime() - 10 * 60 * 1000);
    const eventScope = { organizerId, isDeleted: false };

    const [pendingPayments, undeliveredOrders, upcoming] = await Promise.all([
        prisma.order.count({
            where: {
                status: "PENDING",
                createdAt: {
                    gte: new Date(now.getTime() - PENDING_HOLD_MINUTES * 60 * 1000),
                },
                event: eventScope,
            },
        }),
        prisma.order.count({
            where: {
                status: "COMPLETED",
                event: eventScope,
                OR: [
                    { ticketsSendError: { not: null } },
                    { ticketsSentAt: null, updatedAt: { lt: sendGrace } },
                ],
            },
        }),
        prisma.event.findMany({
            where: {
                ...eventScope,
                isCancelled: false,
                isPublished: true,
                endDate: { gte: now },
            },
            select: {
                id: true,
                title: true,
                _count: { select: { agents: { where: { status: "CONFIRMED" } } } },
            },
            orderBy: { startDate: "asc" },
            take: 5,
        }),
    ]);

    return {
        pendingPayments,
        undeliveredOrders,
        eventsWithoutAgents: upcoming
            .filter((e) => e._count.agents === 0)
            .map(({ id, title }) => ({ id, title })),
    };
}

// ─────────────────────────────────────────────
// Checklist « Premiers pas »
// ─────────────────────────────────────────────

export type ChecklistStep = {
    key: string;
    label: string;
    done: boolean;
    href: string;
    cta: string;
};

/**
 * Étapes de prise en main, cochées d'après les données réelles : aucune
 * information supplémentaire n'est stockée.
 */
export async function getOrganizerChecklist(
    organizerId: string,
): Promise<ChecklistStep[]> {
    const firstEvent = await prisma.event.findFirst({
        where: { organizerId, isDeleted: false },
        orderBy: [{ startDate: "desc" }],
        select: { id: true, slug: true },
    });

    const [ticketCount, payoutMethod, agentCount, scanCount, soldCount] =
        await Promise.all([
            prisma.ticket.count({
                where: { event: { organizerId, isDeleted: false } },
            }),
            prisma.payoutMethod.findUnique({
                where: { userId: organizerId },
                select: { id: true },
            }),
            prisma.eventAgent.count({
                where: { event: { organizerId }, status: { not: "REVOKED" } },
            }),
            prisma.orderItem.count({
                where: {
                    ticket: { event: { organizerId } },
                    firstScannedAt: { not: null },
                },
            }),
            prisma.orderItem.count({
                where: {
                    ticket: { event: { organizerId } },
                    order: stockConsumingOrderFilter(),
                },
            }),
        ]);

    const eventHref = (tab: string) =>
        firstEvent
            ? `/dashboard/events/${firstEvent.id}?tab=${tab}`
            : "/dashboard/events/new";

    return [
        {
            key: "event",
            label: "Créer votre évènement",
            done: !!firstEvent,
            href: "/dashboard/events/new",
            cta: "Créer",
        },
        {
            key: "tickets",
            label: "Configurer les billets et les pass",
            done: ticketCount > 0,
            href: eventHref("billets"),
            cta: "Configurer",
        },
        {
            key: "payout",
            label: "Renseigner un moyen de reversement",
            done: !!payoutMethod,
            href: "/dashboard/payout",
            cta: "Renseigner",
        },
        {
            key: "agents",
            label: "Inviter les agents de contrôle",
            done: agentCount > 0,
            href: eventHref("equipe"),
            cta: "Inviter",
        },
        {
            key: "share",
            label: "Partager la page et vendre un premier billet",
            done: soldCount > 0,
            href: firstEvent ? `/events/${firstEvent.slug}` : "/dashboard/events/new",
            cta: "Voir la page",
        },
        {
            key: "scan",
            label: "Tester le scanner sur un billet",
            done: scanCount > 0,
            href: "/dashboard/scan",
            cta: "Essayer",
        },
    ];
}
