import prisma from "@/lib/prisma";
import { getPaymentStatus } from "@/lib/feexpay";
import { sendOrderConfirmationEmails } from "@/lib/order-confirmation";
import type { OrderStatus, PlatformPaymentStatus } from "@prisma/client";

/**
 * Revérifie une commande encore PENDING directement auprès de FeexPay et
 * applique le résultat si résolu (jamais depuis un payload de webhook brut).
 * Appelée à la fois par le webhook FeexPay ET par le polling client
 * (getOrderPaymentStatus) — c'est ce qui rend la résolution rapide
 * indépendante de la fréquence du cron (Vercel Hobby limite à 1x/jour).
 */
export async function reconcileOrderPayment(orderId: string): Promise<OrderStatus> {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true, totalAmount: true, providerReference: true },
    });
    if (!order) throw new Error("Commande introuvable.");
    if (order.status !== "PENDING" || !order.providerReference) return order.status;

    const check = await getPaymentStatus(order.providerReference);

    if (check.status === "SUCCESSFUL") {
        if (check.amount !== order.totalAmount) {
            console.error("Réconciliation paiement: montant incohérent", {
                orderId,
                expected: order.totalAmount,
                received: check.amount,
            });
            return "PENDING";
        }
        await prisma.order.update({ where: { id: order.id }, data: { status: "COMPLETED" } });
        await sendOrderConfirmationEmails(order.id).catch((err) =>
            console.error("Email confirmation error:", err),
        );
        return "COMPLETED";
    }

    if (check.status === "FAILED") {
        await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
        return "FAILED";
    }

    return "PENDING";
}

/** Équivalent de reconcileOrderPayment pour les frais plateforme (création/mise en vedette). */
export async function reconcilePlatformPayment(
    platformPaymentId: string,
): Promise<PlatformPaymentStatus> {
    const payment = await prisma.platformPayment.findUnique({
        where: { id: platformPaymentId },
    });
    if (!payment) throw new Error("Paiement introuvable.");
    if (payment.status !== "PENDING" || !payment.providerReference) return payment.status;

    const check = await getPaymentStatus(payment.providerReference);

    if (check.status === "SUCCESSFUL") {
        if (check.amount !== payment.amount) {
            console.error("Réconciliation paiement plateforme: montant incohérent", {
                platformPaymentId,
                expected: payment.amount,
                received: check.amount,
            });
            return "PENDING";
        }
        await prisma.platformPayment.update({ where: { id: payment.id }, data: { status: "COMPLETED" } });

        if (payment.type === "EVENT_CREATION") {
            await prisma.event.update({ where: { id: payment.eventId }, data: { isPublished: true } });
        } else if (payment.type === "EVENT_FEATURED") {
            await prisma.event.update({ where: { id: payment.eventId }, data: { isFeatured: true } });
        }
        return "COMPLETED";
    }

    if (check.status === "FAILED") {
        await prisma.platformPayment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
        return "FAILED";
    }

    return "PENDING";
}
