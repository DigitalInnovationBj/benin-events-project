import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyCronAuth } from "../_lib";
import { reconcileOrderPayment, reconcilePlatformPayment } from "@/lib/payment-reconciliation";

// Tourne 1x/jour (limite Vercel Hobby : 1 cron/jour max). La résolution
// rapide des paiements ne dépend PAS de ce cron — c'est le polling actif du
// client pendant l'attente Mobile Money qui s'en charge (voir
// getOrderPaymentStatus/getPlatformPaymentStatus + src/lib/payment-reconciliation.ts).
// Ce cron n'est qu'un filet de sécurité quotidien pour les commandes
// abandonnées (utilisateur qui a fermé l'onglet avant résolution) : une
// dernière tentative de réconciliation active, puis timeout après 20 min.
const TIMEOUT_AFTER_MS = 20 * 60 * 1000;

export async function GET(req: NextRequest) {
    if (!verifyCronAuth(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const timeoutCutoff = new Date(Date.now() - TIMEOUT_AFTER_MS);

    const stalePendingOrders = await prisma.order.findMany({
        where: { status: "PENDING", createdAt: { lt: timeoutCutoff } },
        select: { id: true },
    });
    const stalePendingPayments = await prisma.platformPayment.findMany({
        where: { status: "PENDING", createdAt: { lt: timeoutCutoff } },
        select: { id: true },
    });

    let reconciledOrders = 0;
    let reconciledPayments = 0;

    for (const { id } of stalePendingOrders) {
        try {
            if ((await reconcileOrderPayment(id)) === "COMPLETED") reconciledOrders++;
        } catch (err) {
            console.error("[cron] reconcile-payments: erreur order", id, err);
        }
    }
    for (const { id } of stalePendingPayments) {
        try {
            if ((await reconcilePlatformPayment(id)) === "COMPLETED") reconciledPayments++;
        } catch (err) {
            console.error("[cron] reconcile-payments: erreur platform payment", id, err);
        }
    }

    // Filet de sécurité final : tout ce qui reste PENDING après la dernière
    // tentative de réconciliation ci-dessus est définitivement abandonné.
    const expiredOrders = await prisma.order.updateMany({
        where: { status: "PENDING", createdAt: { lt: timeoutCutoff } },
        data: { status: "EXPIRED" },
    });
    const failedPayments = await prisma.platformPayment.updateMany({
        where: { status: "PENDING", createdAt: { lt: timeoutCutoff } },
        data: { status: "FAILED" },
    });

    return NextResponse.json({
        reconciledOrders,
        reconciledPayments,
        expiredOrders: expiredOrders.count,
        failedPayments: failedPayments.count,
    });
}
