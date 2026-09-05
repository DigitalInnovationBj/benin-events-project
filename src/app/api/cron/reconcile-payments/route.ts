import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyCronAuth } from "../_lib";
import { getPaymentStatus } from "@/lib/feexpay";

// Tourne toutes les ~10-15 min : réconciliation active des paiements FeexPay
// encore PENDING (rattrape un webhook manqué en rappelant directement le
// statut FeexPay), puis filet de sécurité qui bascule en EXPIRED/FAILED les
// commandes/paiements PENDING depuis plus de 20 min sans résolution — un push
// Mobile Money se résout en quelques minutes, pas besoin d'attendre 24h comme
// avec l'ancienne page de paiement hébergée GeniusPay.
const RECONCILE_AFTER_MS = 5 * 60 * 1000;
const TIMEOUT_AFTER_MS = 20 * 60 * 1000;

export async function GET(req: NextRequest) {
    if (!verifyCronAuth(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = Date.now();
    const reconcileCutoff = new Date(now - RECONCILE_AFTER_MS);
    const timeoutCutoff = new Date(now - TIMEOUT_AFTER_MS);

    let reconciledOrders = 0;
    let reconciledPayments = 0;

    // ── Réconciliation active : rattrape les webhooks manqués ─────────────
    const staleOrders = await prisma.order.findMany({
        where: {
            status: "PENDING",
            createdAt: { lt: reconcileCutoff, gte: timeoutCutoff },
            providerReference: { not: null },
        },
        select: { id: true, totalAmount: true, providerReference: true },
    });

    for (const order of staleOrders) {
        try {
            const check = await getPaymentStatus(order.providerReference!);
            if (check.status === "SUCCESSFUL" && check.amount === order.totalAmount) {
                await prisma.order.update({ where: { id: order.id }, data: { status: "COMPLETED" } });
                reconciledOrders++;
            } else if (check.status === "FAILED") {
                await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
            }
        } catch (err) {
            console.error("[cron] reconcile-payments: erreur status-check order", order.id, err);
        }
    }

    const stalePayments = await prisma.platformPayment.findMany({
        where: {
            status: "PENDING",
            createdAt: { lt: reconcileCutoff, gte: timeoutCutoff },
            providerReference: { not: null },
        },
        select: { id: true, amount: true, providerReference: true, type: true, eventId: true },
    });

    for (const payment of stalePayments) {
        try {
            const check = await getPaymentStatus(payment.providerReference!);
            if (check.status === "SUCCESSFUL" && check.amount === payment.amount) {
                await prisma.platformPayment.update({ where: { id: payment.id }, data: { status: "COMPLETED" } });
                if (payment.type === "EVENT_CREATION") {
                    await prisma.event.update({ where: { id: payment.eventId }, data: { isPublished: true } });
                } else if (payment.type === "EVENT_FEATURED") {
                    await prisma.event.update({ where: { id: payment.eventId }, data: { isFeatured: true } });
                }
                reconciledPayments++;
            } else if (check.status === "FAILED") {
                await prisma.platformPayment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
            }
        } catch (err) {
            console.error("[cron] reconcile-payments: erreur status-check platform payment", payment.id, err);
        }
    }

    // ── Filet de sécurité : timeout après 20 min sans résolution ──────────
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
