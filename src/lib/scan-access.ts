import type { Role } from "@prisma/client";
import prisma from "@/lib/prisma";

/**
 * Qui peut scanner les billets d'un évènement.
 *
 * La page de scan et l'API de validation appliquaient deux règles
 * différentes : la page exigeait un `EventAgent` confirmé, l'API acceptait
 * aussi l'organisateur et l'admin. Un organisateur se voyait donc refuser le
 * scanner de son propre évènement, alors que ses scans auraient été acceptés.
 * Cette fonction est désormais la seule source de vérité.
 */
export async function canScanEvent(
    user: { id: string; role: Role },
    eventId: string,
): Promise<boolean> {
    if (user.role === "ADMIN") return true;

    const [event, agent] = await Promise.all([
        prisma.event.findUnique({
            where: { id: eventId },
            select: { organizerId: true },
        }),
        prisma.eventAgent.findUnique({
            where: { eventId_userId: { eventId, userId: user.id } },
            select: { status: true, canScan: true },
        }),
    ]);

    if (!event) return false;
    if (event.organizerId === user.id) return true;

    return agent?.status === "CONFIRMED" && agent.canScan;
}

/**
 * Qui peut activer (vendre) les billets imprimés d'un évènement : point de
 * vente confirmé, organisateur de l'évènement ou admin.
 */
export async function canSellEvent(
    user: { id: string; role: Role },
    eventId: string,
): Promise<boolean> {
    if (user.role === "ADMIN") return true;

    const [event, agent] = await Promise.all([
        prisma.event.findUnique({
            where: { id: eventId },
            select: { organizerId: true },
        }),
        prisma.eventAgent.findUnique({
            where: { eventId_userId: { eventId, userId: user.id } },
            select: { status: true, canSell: true },
        }),
    ]);

    if (!event) return false;
    if (event.organizerId === user.id) return true;

    return agent?.status === "CONFIRMED" && agent.canSell;
}

/** Rôles de l'utilisateur sur un évènement : contrôle d'entrée, vente. */
export async function getEventRoles(
    user: { id: string; role: Role },
    eventId: string,
): Promise<{ canScan: boolean; canSell: boolean }> {
    const [canScan, canSell] = await Promise.all([
        canScanEvent(user, eventId),
        canSellEvent(user, eventId),
    ]);
    return { canScan, canSell };
}

/**
 * L'utilisateur a-t-il au moins un évènement à contrôler ?
 *
 * Sert à n'afficher le lien « Contrôle d'accès » qu'aux personnes concernées.
 * Deux `count` plutôt que la liste complète : appelé à chaque rendu du
 * tableau de bord.
 */
export async function hasScannableEvents(user: {
    id: string;
    role: Role;
}): Promise<boolean> {
    const now = new Date();
    const baseFilter = {
        isDeleted: false,
        isCancelled: false,
        endDate: { gte: now },
    };

    const agentCount = await prisma.eventAgent.count({
        where: { userId: user.id, status: "CONFIRMED", event: baseFilter },
    });
    if (agentCount > 0) return true;

    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") return false;

    const organizedCount = await prisma.event.count({
        where: { ...baseFilter, organizerId: user.id },
    });
    return organizedCount > 0;
}

export type ScannableEvent = {
    id: string;
    title: string;
    slug: string;
    startDate: Date;
    endDate: Date;
    location: string | null;
    eventType: string;
    /** Comment l'utilisateur a obtenu l'accès — affiché comme badge. */
    via: "organizer" | "agent";
    /** Rôles : contrôle d'entrée et/ou point de vente. */
    canScan: boolean;
    canSell: boolean;
};

/**
 * Évènements que l'utilisateur peut scanner, du plus proche au plus lointain.
 *
 * Seuls les évènements non terminés sont listés : on ne contrôle pas l'entrée
 * d'un évènement passé, et la liste resterait sinon polluée indéfiniment.
 */
export async function getScannableEvents(user: {
    id: string;
    role: Role;
}): Promise<ScannableEvent[]> {
    const now = new Date();
    const baseFilter = {
        isDeleted: false,
        isCancelled: false,
        endDate: { gte: now },
    };

    const [organized, assignments] = await Promise.all([
        // Un admin n'organise pas forcément : il garde accès à tout, mais on ne
        // lui déverse pas le catalogue entier ici — seulement ses évènements.
        user.role === "ORGANIZER" || user.role === "ADMIN"
            ? prisma.event.findMany({
                  where: { ...baseFilter, organizerId: user.id },
                  select: {
                      id: true,
                      title: true,
                      slug: true,
                      startDate: true,
                      endDate: true,
                      location: true,
                      eventType: true,
                  },
              })
            : Promise.resolve([]),

        prisma.eventAgent.findMany({
            where: { userId: user.id, status: "CONFIRMED", event: baseFilter },
            select: {
                canScan: true,
                canSell: true,
                event: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        startDate: true,
                        endDate: true,
                        location: true,
                        eventType: true,
                    },
                },
            },
        }),
    ]);

    const byId = new Map<string, ScannableEvent>();

    for (const event of organized) {
        byId.set(event.id, { ...event, via: "organizer", canScan: true, canSell: true });
    }
    // Un organisateur peut aussi être agent sur son propre évènement : la
    // qualité d'organisateur prime, on n'écrase pas l'entrée existante.
    for (const { event, canScan, canSell } of assignments) {
        if (!canScan && !canSell) continue;
        if (!byId.has(event.id)) byId.set(event.id, { ...event, via: "agent", canScan, canSell });
    }

    return [...byId.values()].sort(
        (a, b) => a.startDate.getTime() - b.startDate.getTime(),
    );
}
