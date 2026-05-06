import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/geniuspay";

const STATUS_MAP: Record<string, "FAILED" | "EXPIRED" | "CANCELLED"> = {
    "payment.failed": "FAILED",
    "payment.expired": "EXPIRED",
    "payment.cancelled": "CANCELLED",
};

export async function POST(req: NextRequest) {
    const signature = req.headers.get("x-webhook-signature");
    const timestamp = req.headers.get("x-webhook-timestamp");
    const event = req.headers.get("x-webhook-event");

    // 1. Vérification des headers requis
    if (!signature || !timestamp || !event) {
        return NextResponse.json(
            {
                type: "about:blank",
                title: "Bad Request",
                status: 400,
                detail: "Required header is not present.",
            },
            { status: 400 },
        );
    }

    // 2. Lecture du body brut (nécessaire pour la vérification HMAC)
    const rawBody = await req.text();

    // 3. Vérification de la signature HMAC-SHA256
    if (!verifyWebhookSignature(signature, timestamp, rawBody)) {
        return NextResponse.json(
            {
                type: "about:blank",
                title: "Unauthorized",
                status: 401,
                detail: "Invalid signature",
            },
            { status: 401 },
        );
    }

    // 4. Protection contre les replay attacks (fenêtre de 5 min)
    if (Math.abs(Date.now() / 1000 - parseInt(timestamp, 10)) > 300) {
        return NextResponse.json(
            {
                type: "about:blank",
                title: "Bad Request",
                status: 400,
                detail: "Timestamp too old",
            },
            { status: 400 },
        );
    }

    // 5. Parse du payload
    let payload: {
        data?: { reference?: string; metadata?: Record<string, string> };
    };
    try {
        payload = JSON.parse(rawBody);
    } catch {
        return NextResponse.json(
            {
                type: "about:blank",
                title: "Bad Request",
                status: 400,
                detail: "Invalid JSON body",
            },
            { status: 400 },
        );
    }

    // 6. Traitement de l'événement
    try {
        await processEvent(event, payload);
    } catch (err) {
        console.error("GeniusPay webhook processing error:", err);
        return NextResponse.json(
            {
                type: "about:blank",
                title: "Internal Server Error",
                status: 500,
                detail: "Failed to process webhook",
            },
            { status: 500 },
        );
    }

    return NextResponse.json({ success: true, message: "Webhook processed successfully" });
}

async function processEvent(
    event: string,
    payload: { data?: { reference?: string; metadata?: Record<string, string> } },
) {
    const reference = payload.data?.reference;
    const orderId = payload.data?.metadata?.order_id;

    switch (event) {
        case "payment.success":
            if (orderId) {
                await prisma.order.updateMany({
                    where: { id: orderId, status: "PENDING" },
                    data: {
                        status: "COMPLETED",
                        ...(reference ? { reference } : {}),
                    },
                });
            } else if (reference) {
                await prisma.order.updateMany({
                    where: { reference, status: "PENDING" },
                    data: { status: "COMPLETED" },
                });
            }
            break;

        case "payment.failed":
        case "payment.expired":
        case "payment.cancelled":
            if (orderId) {
                await prisma.order.updateMany({
                    where: { id: orderId, status: "PENDING" },
                    data: { status: STATUS_MAP[event] },
                });
            } else if (reference) {
                await prisma.order.updateMany({
                    where: { reference, status: "PENDING" },
                    data: { status: STATUS_MAP[event] },
                });
            }
            break;

        case "payment.refunded":
            // Géré de façon informative — à étendre si nécessaire
            console.log("GeniusPay webhook: payment.refunded", { reference, orderId });
            break;

        case "webhook.test":
            // Événement de test — ne rien faire
            console.log("GeniusPay webhook: test reçu");
            break;

        default:
            console.log("GeniusPay webhook: événement non géré", { event });
    }
}
