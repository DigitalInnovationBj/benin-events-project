import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/geniuspay";
import { reconcileOrderPayment } from "@/lib/payment-reconciliation";

/**
 * Webhook GeniusPay (paiements par carte).
 *
 * Le contenu n'est qu'un signal : la commande est retrouvée par sa référence
 * GeniusPay (ou sa référence interne), puis revérifiée auprès de l'API avant
 * tout changement — comme pour FeexPay.
 */

// Fenêtre anti-rejeu : une notification signée plus ancienne est refusée.
const MAX_AGE_SECONDS = 5 * 60;

export async function POST(req: NextRequest) {
    const rawBody = await req.text();
    const timestamp = req.headers.get("x-webhook-timestamp");
    const signature = req.headers.get("x-webhook-signature");

    if (!verifyWebhookSignature(rawBody, timestamp, signature)) {
        return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
    }
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > MAX_AGE_SECONDS) {
        return NextResponse.json({ error: "Notification expirée" }, { status: 400 });
    }

    let payload: {
        event?: string;
        data?: {
            transaction?: {
                reference?: string;
                external_reference?: string;
                metadata?: { orderId?: string };
            };
        };
    };
    try {
        payload = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
    }

    const tx = payload.data?.transaction;
    const order = await prisma.order.findFirst({
        where: {
            paymentProvider: "GENIUSPAY",
            OR: [
                ...(tx?.reference ? [{ providerReference: tx.reference }] : []),
                ...(tx?.external_reference ? [{ reference: tx.external_reference }] : []),
                ...(tx?.metadata?.orderId ? [{ id: tx.metadata.orderId }] : []),
            ],
        },
        select: { id: true },
    });

    // Paiement inconnu (autre application sur le même compte, test…) : on
    // accuse réception pour éviter les renvois inutiles.
    if (!order) return NextResponse.json({ received: true });

    try {
        const status = await reconcileOrderPayment(order.id);
        return NextResponse.json({ received: true, status });
    } catch (err) {
        console.error("[GeniusPay webhook] réconciliation:", err);
        // 500 : GeniusPay renverra la notification plus tard.
        return NextResponse.json({ error: "Réconciliation impossible" }, { status: 500 });
    }
}
