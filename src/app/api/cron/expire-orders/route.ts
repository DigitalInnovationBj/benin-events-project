import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyCronAuth } from "../_lib";

// Tourne chaque nuit : bascule en EXPIRED les commandes PENDING abandonnées
// depuis plus de 24 h (filet de sécurité quand GeniusPay n'a jamais envoyé
// payment.expired). Le stock, lui, est libéré dès 1 h via le filtre de
// comptage dans initiateTicketPayment.
export async function GET(req: NextRequest) {
    if (!verifyCronAuth(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await prisma.order.updateMany({
        where: {
            status: "PENDING",
            createdAt: { lt: cutoff },
        },
        data: { status: "EXPIRED" },
    });

    if (result.count > 0) {
        console.log(`[cron] expire-orders : ${result.count} commande(s) expirée(s)`);
    }

    return NextResponse.json({ expired: result.count });
}
