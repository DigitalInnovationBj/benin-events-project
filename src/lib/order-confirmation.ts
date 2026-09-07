import prisma from "@/lib/prisma";
import { sendOrderConfirmationEmail, sendTicketGiftEmail } from "@/lib/email";
import { formatEventDateTime } from "@/lib/format";

/**
 * Envoie l'email de confirmation de commande (+ emails cadeaux aux
 * bénéficiaires distincts de l'acheteur) pour une commande COMPLETED.
 * Point d'entrée unique utilisé aussi bien pour les billets gratuits
 * (appelé directement dans initiateTicketPayment) que pour les billets
 * payants (appelé depuis le webhook FeexPay une fois le paiement confirmé).
 */
export async function sendOrderConfirmationEmails(orderId: string) {
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
                    onlineUrl: true,
                    postPurchaseMessage: true,
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

    const buyer = order.user;
    const recipientEmail = buyer ? buyer.email : order.guestEmail;
    const recipientName = buyer ? (buyer.name ?? "Client") : (order.guestName ?? "Client");

    if (!recipientEmail) {
        await markSendFailure(orderId, "Aucune adresse email pour cette commande.");
        return;
    }

    const eventDate = formatEventDateTime(order.event.startDate);

    try {
        // L'email acheteur porte les billets : son échec est bloquant.
        await sendOrderConfirmationEmail({
            to: recipientEmail,
            customerName: recipientName,
            eventTitle: order.event.title,
            eventDate,
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
            onlineUrl: order.event.onlineUrl,
            postPurchaseMessage: order.event.postPurchaseMessage,
        });

        // Les emails « cadeau » sont secondaires : un bénéficiaire injoignable
        // ne doit pas marquer toute la commande en échec.
        const giftItems = order.items.filter(
            (item) => item.attendeeEmail && item.attendeeEmail !== recipientEmail,
        );

        const gifts = await Promise.allSettled(
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
                    onlineUrl: order.event.onlineUrl,
                    postPurchaseMessage: order.event.postPurchaseMessage,
                }),
            ),
        );

        const failedGifts = gifts.filter((r) => r.status === "rejected").length;

        await prisma.order.update({
            where: { id: orderId },
            data: {
                ticketsSentAt: new Date(),
                ticketsSendError:
                    failedGifts > 0
                        ? `${failedGifts} email(s) cadeau non délivré(s).`
                        : null,
            },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[order ${orderId}] envoi des billets échoué :`, message);
        await markSendFailure(orderId, message);
        throw err;
    }
}

/** Trace l'échec sans masquer l'erreur d'origine si la mise à jour échoue. */
async function markSendFailure(orderId: string, message: string) {
    await prisma.order
        .update({
            where: { id: orderId },
            data: { ticketsSentAt: null, ticketsSendError: message.slice(0, 500) },
        })
        .catch((err) =>
            console.error(`[order ${orderId}] trace d'échec impossible :`, err),
        );
}
