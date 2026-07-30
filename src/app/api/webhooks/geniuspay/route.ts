import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/geniuspay";
import { sendOrderConfirmationEmail, sendTicketGiftEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

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

async function sendConfirmationEmail(orderId: string) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            user: { select: { email: true, name: true } },
            event: {
                select: {
                    title: true,
                    startDate: true,
                    location: true,
                    eventType: true,
                },
            },
            items: {
                select: {
                    id: true,
                    price: true,
                    quantity: true,
                    attendeeName: true,
                    attendeeEmail: true,
                    ticket: { select: { title: true, emailTemplate: true } },
                },
            },
        },
    });

    if (!order) return;

    // Utilise les infos invité si la commande n'est pas liée à un compte
    const buyer = order.user;
    const recipientEmail = buyer ? buyer.email : order.guestEmail;
    const recipientName = buyer ? (buyer.name ?? "Client") : (order.guestName ?? "Client");

    if (!recipientEmail) return;

    await sendOrderConfirmationEmail({
        to: recipientEmail,
        customerName: recipientName,
        eventTitle: order.event.title,
        eventDate: new Date(order.event.startDate).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Africa/Porto-Novo",
        }),
        eventLocation: order.event.location,
        eventType: order.event.eventType,
        orderReference: order.reference,
        totalAmount: order.totalAmount,
        items: order.items.map((item) => ({
            id: item.id,
            ticketTitle: item.ticket.title,
            quantity: item.quantity,
            price: item.price,
            emailTemplate: item.ticket.emailTemplate,
        })),
    });

    // Envoyer un email cadeau à chaque bénéficiaire distinct de l'acheteur
    const eventDate = new Date(order.event.startDate).toLocaleDateString("fr-FR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit", timeZone: "Africa/Porto-Novo",
    });

    const giftItems = order.items.filter(
        (item) => item.attendeeEmail && item.attendeeEmail !== recipientEmail,
    );

    await Promise.allSettled(
        giftItems.map((item) =>
            sendTicketGiftEmail({
                to: item.attendeeEmail!,
                recipientName: item.attendeeName ?? "Invité",
                senderName: recipientName,
                eventTitle: order.event.title,
                eventDate,
                eventLocation: order.event.location,
                eventType: order.event.eventType,
                ticketTitle: item.ticket.title,
                price: item.price,
                emailTemplate: item.ticket.emailTemplate,
                orderItemId: item.id,
                orderReference: order.reference,
            }),
        ),
    );
}

async function processPlatformPayment(
    event: string,
    platformPaymentId: string,
    reference: string | undefined,
) {
    const payment = await prisma.platformPayment.findUnique({
        where: { id: platformPaymentId },
    });
    if (!payment || payment.status !== "PENDING") return;

    if (event === "payment.success") {
        await prisma.platformPayment.update({
            where: { id: payment.id },
            data: { status: "COMPLETED", ...(reference ? { reference } : {}) },
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
    } else {
        await prisma.platformPayment.update({
            where: { id: payment.id },
            data: { status: "FAILED" },
        });
    }
}

async function processEvent(
    event: string,
    payload: { data?: { reference?: string; metadata?: Record<string, string> } },
) {
    const reference = payload.data?.reference;
    const metadata = payload.data?.metadata ?? {};

    // Paiements plateforme (création / mise en vedette)
    if (metadata.payment_context === "platform" && metadata.platform_payment_id) {
        await processPlatformPayment(event, metadata.platform_payment_id, reference);
        return;
    }

    const orderId = metadata.order_id;

    switch (event) {
        case "payment.success": {
            const updatedOrder = orderId
                ? await prisma.order.findFirst({
                      where: { id: orderId, status: "PENDING" },
                  })
                : reference
                  ? await prisma.order.findFirst({
                        where: { reference, status: "PENDING" },
                    })
                  : null;

            if (updatedOrder) {
                await prisma.order.update({
                    where: { id: updatedOrder.id },
                    data: {
                        status: "COMPLETED",
                        ...(reference ? { reference } : {}),
                    },
                });
                await sendConfirmationEmail(updatedOrder.id).catch((err) =>
                    console.error("Email confirmation error:", err),
                );
            }
            break;
        }

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

        case "payment.refunded": {
            // GeniusPay n'expose pas d'API de remboursement programmatique :
            // ce webhook confirme un remboursement initié côté GeniusPay
            // (ex. suite à un litige), distinct du remboursement manuel
            // (markOrderRefunded) déclenché après annulation d'évènement.
            const refundedOrder = orderId
                ? await prisma.order.findFirst({
                      where: { id: orderId, status: "COMPLETED" },
                  })
                : reference
                  ? await prisma.order.findFirst({
                        where: { reference, status: "COMPLETED" },
                    })
                  : null;

            if (refundedOrder) {
                await prisma.order.update({
                    where: { id: refundedOrder.id },
                    data: { status: "REFUNDED" },
                });
            }
            break;
        }

        case "webhook.test":
            console.log("GeniusPay webhook: test reçu");
            break;

        default:
            console.log("GeniusPay webhook: événement non géré", { event });
    }
}
