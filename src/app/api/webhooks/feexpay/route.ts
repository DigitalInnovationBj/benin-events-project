import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { decodeCallbackInfo, getPaymentStatus, verifyWebhookAuth } from "@/lib/feexpay";
import { sendOrderConfirmationEmails } from "@/lib/order-confirmation";
import { revalidatePath } from "next/cache";

// FeexPay ne signe pas ses webhooks en HMAC : la seule protection est l'en-tête
// Authorization configuré dans le dashboard FeexPay + la revérification
// systématique du statut/montant auprès de leur API (jamais le payload brut).
export async function POST(req: NextRequest) {
    if (!verifyWebhookAuth(req.headers.get("authorization"))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload: { callback_info?: string };
    try {
        payload = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Piège FeexPay : `reference`/`order_id` à la racine du payload sont
    // l'identifiant DE FEEXPAY, jamais le nôtre — la corrélation avec notre
    // commande locale se fait UNIQUEMENT via callback_info.
    const callbackInfo = payload.callback_info;
    if (!callbackInfo) {
        return NextResponse.json({ error: "Missing callback_info" }, { status: 400 });
    }

    const decoded = decodeCallbackInfo(callbackInfo);
    if (!decoded) {
        console.error("FeexPay webhook: callback_info non reconnu", { callbackInfo });
        return NextResponse.json({ error: "Unrecognized callback_info" }, { status: 400 });
    }

    try {
        if (decoded.kind === "order") {
            await processOrderPayment(decoded.id);
        } else {
            await processPlatformPayment(decoded.id);
        }
    } catch (err) {
        console.error("FeexPay webhook processing error:", err);
        return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

async function processOrderPayment(orderId: string) {
    // Idempotence : si la commande n'est plus PENDING, elle a déjà été
    // traitée (livraison en double du webhook) — on ne fait rien de plus.
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true, totalAmount: true, providerReference: true, eventId: true },
    });
    if (!order || order.status !== "PENDING") return;
    if (!order.providerReference) return;

    // Ne jamais faire confiance au payload brut : on revérifie le statut ET
    // le montant directement auprès de FeexPay avant de créditer quoi que ce soit.
    const check = await getPaymentStatus(order.providerReference);

    if (check.status === "SUCCESSFUL") {
        if (check.amount !== order.totalAmount) {
            console.error("FeexPay webhook: montant incohérent", {
                orderId,
                expected: order.totalAmount,
                received: check.amount,
            });
            return;
        }
        await prisma.order.update({
            where: { id: order.id },
            data: { status: "COMPLETED" },
        });
        await sendOrderConfirmationEmails(order.id).catch((err) =>
            console.error("Email confirmation error:", err),
        );
    } else if (check.status === "FAILED") {
        await prisma.order.update({
            where: { id: order.id },
            data: { status: "FAILED" },
        });
    }
    // Sinon (toujours PENDING côté FeexPay) : rien à faire, le webhook a
    // probablement été envoyé avant la confirmation finale.
}

async function processPlatformPayment(platformPaymentId: string) {
    const payment = await prisma.platformPayment.findUnique({
        where: { id: platformPaymentId },
    });
    if (!payment || payment.status !== "PENDING") return;
    if (!payment.providerReference) return;

    const check = await getPaymentStatus(payment.providerReference);

    if (check.status === "SUCCESSFUL") {
        if (check.amount !== payment.amount) {
            console.error("FeexPay webhook: montant incohérent (platform)", {
                platformPaymentId,
                expected: payment.amount,
                received: check.amount,
            });
            return;
        }
        await prisma.platformPayment.update({
            where: { id: payment.id },
            data: { status: "COMPLETED" },
        });

        if (payment.type === "EVENT_CREATION") {
            await prisma.event.update({
                where: { id: payment.eventId },
                data: { isPublished: true },
            });
            revalidatePath("/dashboard/events");
            revalidatePath("/");
        } else if (payment.type === "EVENT_FEATURED") {
            await prisma.event.update({
                where: { id: payment.eventId },
                data: { isFeatured: true },
            });
            revalidatePath(`/dashboard/events/${payment.eventId}`);
            revalidatePath("/");
        }
    } else if (check.status === "FAILED") {
        await prisma.platformPayment.update({
            where: { id: payment.id },
            data: { status: "FAILED" },
        });
    }
}
