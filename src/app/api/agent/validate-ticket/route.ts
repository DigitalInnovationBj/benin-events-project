import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/permissions";
import { canScanEvent } from "@/lib/scan-access";
import prisma from "@/lib/prisma";
import { dayKey, eventDayKeys, formatDayKey } from "@/lib/ticket-days";

const STATUS_DETAIL: Record<string, string> = {
    PENDING:   "Le paiement de cette commande n'a pas encore été confirmé.",
    FAILED:    "Le paiement de cette commande a échoué.",
    CANCELLED: "Cette commande a été annulée par l'acheteur.",
    EXPIRED:   "Cette commande a expiré sans paiement.",
};

function fmtDate(d: Date) {
    return d.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Porto-Novo",
    });
}

export async function POST(req: NextRequest) {
    // ── 1. Auth ───────────────────────────────────────────────────────────
    const dbUser = await getCurrentUser();
    if (!dbUser) {
        return NextResponse.json({
            valid: false,
            message: "Non authentifié",
            detail: "Vous devez être connecté pour valider des billets.",
        }, { status: 401 });
    }

    // ── 2. Validation du body ─────────────────────────────────────────────
    const body = await req.json().catch(() => null);
    if (!body?.itemId || !body?.orderReference || !body?.eventId) {
        return NextResponse.json({
            valid: false,
            message: "Requête invalide",
            detail: "Données de scan manquantes ou corrompues.",
        }, { status: 400 });
    }

    const { itemId, orderReference, eventId } = body as {
        itemId: string;
        orderReference: string;
        eventId: string;
    };

    // ── 3. Vérification des droits de scan ────────────────────────────────
    // Règle partagée avec la page /agent/[eventId]/scan (cf. lib/scan-access).
    if (!(await canScanEvent(dbUser, eventId))) {
        return NextResponse.json({
            valid: false,
            message: "Accès refusé",
            detail: "Vous n'êtes pas autorisé à scanner les billets de cet évènement.",
        }, { status: 403 });
    }

    // ── 4. Recherche de l'OrderItem sans contraintes (pour messages précis) ──
    const rawItem = await prisma.orderItem.findUnique({
        where: { id: itemId },
        include: {
            ticket: {
                select: {
                    title: true,
                    eventId: true,
                    validDays: true,
                    alsoValidForEventId: true,
                    event: { select: { title: true } },
                },
            },
            order: {
                include: {
                    event: { select: { id: true, title: true } },
                },
            },
        },
    });

    // ── 5. Item introuvable ───────────────────────────────────────────────
    if (!rawItem) {
        return NextResponse.json({
            valid: false,
            message: "Billet introuvable",
            detail: "Ce QR code ne correspond à aucun billet enregistré. Il est peut-être falsifié ou corrompu.",
        });
    }

    // ── 6. Référence de commande incorrecte ───────────────────────────────
    if (rawItem.order.reference !== orderReference) {
        return NextResponse.json({
            valid: false,
            message: "QR code invalide",
            detail: "La référence de commande encodée dans ce QR ne correspond pas au billet.",
        });
    }

    // ── 7. Billet d'un autre évènement ────────────────────────────────────
    // Un billet est accepté dans son évènement, et aussi dans celui déclaré par
    // `alsoValidForEventId` (ex. pass VVIP valable aux conférences) — à
    // condition d'être un billet multi-jours, seul à compter les scans par lieu.
    const isOwnEvent = rawItem.ticket.eventId === eventId;
    const isExtraEvent =
        !isOwnEvent &&
        rawItem.ticket.alsoValidForEventId === eventId &&
        rawItem.ticket.validDays.length > 0;
    if (!isOwnEvent && !isExtraEvent) {
        return NextResponse.json({
            valid: false,
            message: "Mauvais évènement",
            detail: `Ce billet est valable pour « ${rawItem.ticket.event.title} », pas pour cet évènement.`,
            ticketTitle: rawItem.ticket.title,
        });
    }

    // ── 8. Commande non COMPLETED ─────────────────────────────────────────
    if (rawItem.order.status !== "COMPLETED") {
        return NextResponse.json({
            valid: false,
            message: "Commande non confirmée",
            detail: STATUS_DETAIL[rawItem.order.status] ?? "Statut de commande inconnu.",
            ticketTitle: rawItem.ticket.title,
        });
    }

    // ── 8bis. Billet multi-jours : un scan autorisé par jour de validité ───
    // Les billets sans `validDays` ignorent ce bloc et suivent le parcours
    // historique (étapes 9 et 10).
    if (rawItem.ticket.validDays.length > 0) {
        const validDays = rawItem.ticket.validDays;
        const today = dayKey();

        // Accès supplémentaire (ex. conférences) : le billet n'ouvre l'accès
        // que les jours où CET évènement a lieu, en plus de ses propres jours.
        let allowedDays = validDays;
        if (isExtraEvent) {
            const scannedEvent = await prisma.event.findUnique({
                where: { id: eventId },
                select: { startDate: true, endDate: true },
            });
            const scannedEventDays = scannedEvent
                ? eventDayKeys(scannedEvent.startDate, scannedEvent.endDate)
                : [];
            allowedDays = validDays.filter((d) => scannedEventDays.includes(d));
        }

        if (!allowedDays.includes(today)) {
            return NextResponse.json({
                valid: false,
                message: "Billet non valable aujourd'hui",
                detail: `Ce billet est valable ici les : ${allowedDays.map(formatDayKey).join(", ") || "aucun jour"}.`,
                ticketTitle: rawItem.ticket.title,
                attendeeName: rawItem.attendeeName,
            });
        }

        try {
            await prisma.$transaction([
                prisma.ticketScan.create({
                    data: { orderItemId: rawItem.id, eventId, day: today },
                }),
                ...(rawItem.firstScannedAt
                    ? []
                    : [
                          prisma.orderItem.update({
                              where: { id: rawItem.id },
                              data: { firstScannedAt: new Date() },
                          }),
                      ]),
            ]);
        } catch (err) {
            // P2002 : (billet, jour) déjà enregistré — scan du même jour.
            if ((err as { code?: string }).code === "P2002") {
                return NextResponse.json({
                    valid: false,
                    message: "Billet déjà utilisé",
                    detail: `Ce billet a déjà été scanné ici aujourd'hui (${formatDayKey(today)}).`,
                    ticketTitle: rawItem.ticket.title,
                    attendeeName: rawItem.attendeeName,
                    validDays: allowedDays,
                    currentDay: today,
                });
            }
            throw err;
        }

        const daysScanned = await prisma.ticketScan.count({
            where: { orderItemId: rawItem.id, eventId },
        });

        return NextResponse.json({
            valid: true,
            message: "Billet valide",
            ticketTitle: rawItem.ticket.title,
            attendeeName: rawItem.attendeeName,
            validDays: allowedDays,
            currentDay: today,
            daysScanned,
        });
    }

    // ── 9. Billet déjà entièrement utilisé ───────────────────────────────
    if (rawItem.scannedCount >= rawItem.quantity) {
        return NextResponse.json({
            valid: false,
            message: "Billet déjà utilisé",
            detail: rawItem.firstScannedAt
                ? `Scanné pour la première fois le ${fmtDate(rawItem.firstScannedAt)}.`
                : "Ce billet a déjà été scanné.",
            ticketTitle: rawItem.ticket.title,
            attendeeName: rawItem.attendeeName,
            scannedCount: rawItem.scannedCount,
            quantity: rawItem.quantity,
        });
    }

    // ── 10. Valide → incrémenter (atomique : refuse si le quota est déjà atteint,
    // même en cas de scans simultanés par plusieurs agents) ───────────────
    const { count } = await prisma.orderItem.updateMany({
        where: { id: rawItem.id, scannedCount: { lt: rawItem.quantity } },
        data: {
            scannedCount: { increment: 1 },
            firstScannedAt: rawItem.firstScannedAt ?? new Date(),
        },
    });

    if (count === 0) {
        return NextResponse.json({
            valid: false,
            message: "Billet déjà utilisé",
            detail: "Ce billet vient d'être scanné par un autre agent.",
            ticketTitle: rawItem.ticket.title,
            attendeeName: rawItem.attendeeName,
            scannedCount: rawItem.quantity,
            quantity: rawItem.quantity,
        });
    }

    const updated = await prisma.orderItem.findUnique({
        where: { id: rawItem.id },
        select: { scannedCount: true },
    });

    return NextResponse.json({
        valid: true,
        message: "Billet valide",
        ticketTitle: rawItem.ticket.title,
        attendeeName: rawItem.attendeeName,
        scannedCount: updated?.scannedCount ?? rawItem.scannedCount + 1,
        quantity: rawItem.quantity,
    });
}
