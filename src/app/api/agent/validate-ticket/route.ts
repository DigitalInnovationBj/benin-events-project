import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ valid: false, message: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body?.itemId || !body?.orderReference || !body?.eventId) {
        return NextResponse.json({ valid: false, message: "Requête invalide" }, { status: 400 });
    }

    const { itemId, orderReference, eventId } = body as {
        itemId: string;
        orderReference: string;
        eventId: string;
    };

    // Check caller is a confirmed agent for this event
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser) {
        return NextResponse.json({ valid: false, message: "Utilisateur introuvable" }, { status: 401 });
    }

    const agent = await prisma.eventAgent.findUnique({
        where: { eventId_userId: { eventId, userId: dbUser.id } },
    });

    const isOrganizer = dbUser.role === "ADMIN" || (dbUser.role === "ORGANIZER" && await prisma.event.findFirst({ where: { id: eventId, organizerId: dbUser.id } }).then(Boolean));

    if (!isOrganizer && (!agent || agent.status !== "CONFIRMED")) {
        return NextResponse.json({ valid: false, message: "Accès refusé" }, { status: 403 });
    }

    // Fetch the order item
    const orderItem = await prisma.orderItem.findFirst({
        where: {
            id: itemId,
            order: {
                reference: orderReference,
                eventId,
                status: "COMPLETED",
            },
        },
        include: {
            ticket: true,
            order: true,
        },
    });

    if (!orderItem) {
        return NextResponse.json({
            valid: false,
            message: "Billet invalide ou commande introuvable",
        });
    }

    if (orderItem.scannedCount >= orderItem.quantity) {
        return NextResponse.json({
            valid: false,
            message: "Billet déjà utilisé",
            ticketTitle: orderItem.ticket.title,
            scannedCount: orderItem.scannedCount,
            quantity: orderItem.quantity,
        });
    }

    // Increment scan count
    const updated = await prisma.orderItem.update({
        where: { id: orderItem.id },
        data: {
            scannedCount: { increment: 1 },
            firstScannedAt: orderItem.firstScannedAt ?? new Date(),
        },
    });

    return NextResponse.json({
        valid: true,
        message: "Billet valide ✓",
        ticketTitle: orderItem.ticket.title,
        scannedCount: updated.scannedCount,
        quantity: orderItem.quantity,
    });
}
