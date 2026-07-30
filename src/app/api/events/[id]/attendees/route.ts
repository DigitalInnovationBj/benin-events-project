import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";

// Échappe une valeur CSV (séparateur ; — convention Excel français)
function csvCell(value: string | number | null | undefined): string {
    const s = String(value ?? "");
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function fmtDate(d: Date | null): string {
    if (!d) return "";
    return d.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Porto-Novo",
    });
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id: eventId } = await params;

    // ── Autorisation : organisateur propriétaire ou admin ─────────────────
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, title: true, slug: true, organizerId: true },
    });
    if (!event) {
        return NextResponse.json({ error: "Évènement introuvable" }, { status: 404 });
    }
    if (user.role !== "ADMIN" && event.organizerId !== user.id) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // ── Participants : billets des commandes payées ───────────────────────
    const items = await prisma.orderItem.findMany({
        where: {
            order: { eventId, status: "COMPLETED" },
        },
        include: {
            ticket: { select: { title: true } },
            order: {
                select: {
                    reference: true,
                    createdAt: true,
                    user: { select: { name: true, email: true } },
                    guestName: true,
                    guestEmail: true,
                },
            },
        },
        orderBy: { createdAt: "asc" },
    });

    const header = [
        "Billet",
        "Participant",
        "Email participant",
        "Acheteur",
        "Email acheteur",
        "Référence commande",
        "Acheté le",
        "Scans",
        "Premier scan",
    ].join(";");

    const rows = items.map((item) => {
        const buyerName = item.order.user?.name ?? item.order.guestName ?? "";
        const buyerEmail = item.order.user?.email ?? item.order.guestEmail ?? "";
        return [
            csvCell(item.ticket.title),
            csvCell(item.attendeeName ?? buyerName),
            csvCell(item.attendeeEmail ?? buyerEmail),
            csvCell(buyerName),
            csvCell(buyerEmail),
            csvCell(item.order.reference),
            csvCell(fmtDate(item.order.createdAt)),
            csvCell(`${item.scannedCount}/${item.quantity}`),
            csvCell(fmtDate(item.firstScannedAt)),
        ].join(";");
    });

    // BOM UTF-8 pour qu'Excel affiche correctement les accents
    const csv = "﻿" + [header, ...rows].join("\r\n");

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="participants-${event.slug}.csv"`,
            "Cache-Control": "no-store",
        },
    });
}
