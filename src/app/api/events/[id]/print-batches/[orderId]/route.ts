import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { formatEventDateLong, formatXOF } from "@/lib/format";
import { formatDayKey } from "@/lib/ticket-days";
import { generatePrintSheetPdf, PrintArtError } from "@/lib/print-sheet-pdf";
import { printedTicketCode, ticketPrintCode } from "@/lib/printed-tickets";

// Un lot de 400 billets = 100 pages : le rendu peut prendre plusieurs secondes.
export const maxDuration = 60;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** PDF d'impression d'un lot de billets physiques (organisateur ou admin). */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string; orderId: string }> },
) {
    const { id: eventId, orderId } = await params;

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
            reference: true,
            status: true,
            eventId: true,
            event: {
                select: {
                    title: true,
                    startDate: true,
                    location: true,
                    eventType: true,
                    theme: true,
                    organizerId: true,
                },
            },
            items: {
                select: {
                    id: true,
                    serial: true,
                    ticket: {
                        select: {
                            title: true,
                            price: true,
                            validDays: true,
                            printFrontUrl: true,
                            printCode: true,
                            printNumberColor: true,
                        },
                    },
                },
                orderBy: { serial: "asc" },
            },
        },
    });

    if (!order || order.eventId !== eventId || order.status !== "PRINTED") {
        return NextResponse.json({ error: "Lot introuvable" }, { status: 404 });
    }
    if (user.role !== "ADMIN" && order.event.organizerId !== user.id) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    if (order.items.length === 0) {
        return NextResponse.json({ error: "Ce lot ne contient plus de billets" }, { status: 404 });
    }

    const ticket = order.items[0].ticket;
    let pdf: Buffer;
    try {
        pdf = await generatePrintSheetPdf({
        eventTitle: order.event.title,
        eventDate: formatEventDateLong(order.event.startDate),
        eventLocation: order.event.eventType === "IN_PERSON" ? order.event.location : "En ligne",
        theme: order.event.theme,
        ticketTitle: ticket.title,
        priceLabel: ticket.price === 0 ? "Gratuit" : formatXOF(ticket.price),
        validity: ticket.validDays.length > 0
            ? `Valable : ${ticket.validDays.map(formatDayKey).join(", ")}`
            : null,
        frontUrl: ticket.printFrontUrl,
        printCode: ticketPrintCode(ticket),
        numberColor: ticket.printNumberColor,
        appUrl: APP_URL,
        items: order.items.map((i) => ({ id: i.id, serial: i.serial, orderReference: order.reference })),
        });
    } catch (err) {
        // Visuel illisible : on refuse plutôt que d'imprimer des billets sans fond.
        if (err instanceof PrintArtError) {
            return NextResponse.json({ error: err.message }, { status: 502 });
        }
        throw err;
    }

    const code = ticketPrintCode(ticket);
    const first = printedTicketCode(code, order.items[0].serial);
    const last = printedTicketCode(code, order.items[order.items.length - 1].serial);

    return new NextResponse(new Uint8Array(pdf), {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="billets-${first}-${last.split("-").pop()}.pdf"`,
            "Cache-Control": "private, no-store",
        },
    });
}
