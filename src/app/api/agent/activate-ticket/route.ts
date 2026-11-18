import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/permissions";
import { canSellEvent } from "@/lib/scan-access";
import prisma from "@/lib/prisma";
import { printedTicketCode } from "@/lib/printed-tickets";

function fmtDate(d: Date) {
    return d.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Porto-Novo",
    });
}

/**
 * Activation d'un billet imprimé par un point de vente, au moment de la vente.
 *
 * Le QR est le même que pour l'entrée : c'est le mode « Vente » du scanner qui
 * appelle cette route. Le billet est rattaché à l'utilisateur qui l'active ;
 * c'est la base du bilan du point de vente.
 */
export async function POST(req: NextRequest) {
    const dbUser = await getCurrentUser();
    if (!dbUser) {
        return NextResponse.json({
            valid: false,
            message: "Non authentifié",
            detail: "Vous devez être connecté pour activer des billets.",
        }, { status: 401 });
    }

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

    if (!(await canSellEvent(dbUser, eventId))) {
        return NextResponse.json({
            valid: false,
            message: "Accès refusé",
            detail: "Vous n'êtes pas point de vente pour cet évènement.",
        }, { status: 403 });
    }

    const item = await prisma.orderItem.findUnique({
        where: { id: itemId },
        select: {
            id: true,
            price: true,
            serial: true,
            activatedAt: true,
            activatedBy: { select: { name: true, email: true } },
            ticket: { select: { title: true, eventId: true, event: { select: { title: true } } } },
            order: { select: { reference: true, status: true } },
        },
    });

    if (!item || item.order.reference !== orderReference) {
        return NextResponse.json({
            valid: false,
            message: "Billet introuvable",
            detail: "Ce QR code ne correspond à aucun billet enregistré. Il est peut-être falsifié, ou le lot a été annulé.",
        });
    }

    if (item.ticket.eventId !== eventId) {
        return NextResponse.json({
            valid: false,
            message: "Mauvais évènement",
            detail: `Ce billet est valable pour « ${item.ticket.event.title} », pas pour cet évènement.`,
            ticketTitle: item.ticket.title,
        });
    }

    if (item.order.status !== "PRINTED") {
        return NextResponse.json({
            valid: false,
            message: "Billet en ligne",
            detail: "Ce billet a été acheté en ligne : il n'y a rien à activer. Pour l'entrée, passez en mode Entrée.",
            ticketTitle: item.ticket.title,
        });
    }

    const code = printedTicketCode(item.ticket.title, item.serial);

    if (item.activatedAt) {
        const seller = item.activatedBy?.name || item.activatedBy?.email || "un point de vente";
        return NextResponse.json({
            valid: false,
            message: "Billet déjà vendu",
            detail: `Activé par ${seller} le ${fmtDate(item.activatedAt)}.`,
            ticketTitle: item.ticket.title,
            code,
        });
    }

    // Atomique : deux points de vente scannant le même billet au même instant
    // ne peuvent pas l'activer tous les deux.
    const { count } = await prisma.orderItem.updateMany({
        where: { id: item.id, activatedAt: null },
        data: { activatedAt: new Date(), activatedById: dbUser.id },
    });
    if (count === 0) {
        return NextResponse.json({
            valid: false,
            message: "Billet déjà vendu",
            detail: "Ce billet vient d'être activé par un autre point de vente.",
            ticketTitle: item.ticket.title,
            code,
        });
    }

    const soldBySeller = await prisma.orderItem.count({
        where: { activatedById: dbUser.id, ticket: { eventId } },
    });

    return NextResponse.json({
        valid: true,
        message: "Billet activé",
        detail: "Vente enregistrée. Le billet est valable à l'entrée.",
        ticketTitle: item.ticket.title,
        code,
        price: item.price,
        soldBySeller,
    });
}
