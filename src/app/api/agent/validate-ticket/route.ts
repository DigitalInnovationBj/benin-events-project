import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/permissions";
import { canScanEvent } from "@/lib/scan-access";
import prisma from "@/lib/prisma";
import { dayKey, formatDayKey } from "@/lib/ticket-days";

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

    const { itemId, orderReference, eventId, sessionId } = body as {
        itemId: string;
        orderReference: string;
        eventId: string;
        /** Point de contrôle d'une session (absent = entrée générale). */
        sessionId?: string;
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
                    sessions: { select: { sessionId: true } },
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
    if (rawItem.ticket.eventId !== eventId) {
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

    const today = dayKey();

    // ── 8a. Point de contrôle d'une session (ex. conférences) ────────────
    // Seuls les billets liés à la session passent, une fois, le jour de la
    // session. Indépendant de l'entrée générale : un pass VVIP scanné à
    // l'entrée du festival passe aussi aux conférences le même jour.
    if (sessionId) {
        const session = await prisma.eventSession.findUnique({
            where: { id: sessionId },
            select: { id: true, eventId: true, name: true, day: true, capacity: true },
        });
        if (!session || session.eventId !== eventId) {
            return NextResponse.json({
                valid: false,
                message: "Session introuvable",
                detail: "Ce point de contrôle n'existe plus. Revenez à la liste des points de contrôle.",
            }, { status: 400 });
        }

        if (!rawItem.ticket.sessions.some((s) => s.sessionId === session.id)) {
            return NextResponse.json({
                valid: false,
                message: "Pas d'accès à cette session",
                detail: `Le billet « ${rawItem.ticket.title} » ne donne pas accès à « ${session.name} ».`,
                ticketTitle: rawItem.ticket.title,
                attendeeName: rawItem.attendeeName,
            });
        }

        if (session.day !== today) {
            return NextResponse.json({
                valid: false,
                message: "Session pas aujourd'hui",
                detail: `« ${session.name} » a lieu le ${formatDayKey(session.day)}.`,
                ticketTitle: rawItem.ticket.title,
                attendeeName: rawItem.attendeeName,
            });
        }

        if (session.capacity != null) {
            const entered = await prisma.ticketScan.count({
                where: { checkpoint: session.id },
            });
            if (entered >= session.capacity) {
                return NextResponse.json({
                    valid: false,
                    message: "Session complète",
                    detail: `Les ${session.capacity} places de « ${session.name} » sont occupées.`,
                    ticketTitle: rawItem.ticket.title,
                    attendeeName: rawItem.attendeeName,
                });
            }
        }

        try {
            await prisma.ticketScan.create({
                data: { orderItemId: rawItem.id, eventId, day: today, checkpoint: session.id },
            });
        } catch (err) {
            if ((err as { code?: string }).code === "P2002") {
                return NextResponse.json({
                    valid: false,
                    message: "Billet déjà utilisé",
                    detail: `Ce billet est déjà entré à « ${session.name} ».`,
                    ticketTitle: rawItem.ticket.title,
                    attendeeName: rawItem.attendeeName,
                });
            }
            throw err;
        }

        return NextResponse.json({
            valid: true,
            message: "Billet valide",
            detail: `Accès à « ${session.name} ».`,
            ticketTitle: rawItem.ticket.title,
            attendeeName: rawItem.attendeeName,
            sessionName: session.name,
        });
    }

    // ── 8bis. Billet multi-jours : un scan autorisé par jour de validité ───
    // Les billets sans `validDays` ignorent ce bloc et suivent le parcours
    // historique (étapes 9 et 10).
    if (rawItem.ticket.validDays.length > 0) {
        const validDays = rawItem.ticket.validDays;

        if (!validDays.includes(today)) {
            return NextResponse.json({
                valid: false,
                message: "Billet non valable aujourd'hui",
                detail: `Ce billet est valable les : ${validDays.map(formatDayKey).join(", ")}.`,
                ticketTitle: rawItem.ticket.title,
                attendeeName: rawItem.attendeeName,
            });
        }

        try {
            await prisma.$transaction([
                prisma.ticketScan.create({
                    data: { orderItemId: rawItem.id, eventId, day: today, checkpoint: "main" },
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
            // P2002 : (billet, jour, entrée générale) déjà enregistré.
            if ((err as { code?: string }).code === "P2002") {
                return NextResponse.json({
                    valid: false,
                    message: "Billet déjà utilisé",
                    detail: `Ce billet a déjà été scanné aujourd'hui (${formatDayKey(today)}).`,
                    ticketTitle: rawItem.ticket.title,
                    attendeeName: rawItem.attendeeName,
                    validDays,
                    currentDay: today,
                });
            }
            throw err;
        }

        const daysScanned = await prisma.ticketScan.count({
            where: { orderItemId: rawItem.id, checkpoint: "main" },
        });

        return NextResponse.json({
            valid: true,
            message: "Billet valide",
            ticketTitle: rawItem.ticket.title,
            attendeeName: rawItem.attendeeName,
            validDays,
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
