"use server";

import { getCurrentUser } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import {
    createPayment,
    encodeCallbackInfo,
    getNetwork,
    isValidNetwork,
    isValidLocalNumber,
    type FeexpayNetwork,
} from "@/lib/feexpay";
import { sendRefundConfirmationEmail } from "@/lib/email";
import { sendOrderConfirmationEmails } from "@/lib/order-confirmation";
import { reconcileOrderPayment } from "@/lib/payment-reconciliation";
import { revalidatePath } from "next/cache";
import { validatePromoCode } from "@/actions/eventPartner.actions";

function generateReference(): string {
    return `BE-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Un billet du lot : soit pour l'acheteur lui-même, soit pour un bénéficiaire nommé
export type TicketAssignment = {
    forSelf: boolean;
    name?: string;  // nom du bénéficiaire (ou de l'acheteur si forSelf)
    email?: string; // email du bénéficiaire (ou de l'acheteur si forSelf)
};

export type PaymentInput = {
    ticketId: string;
    assignments: TicketAssignment[]; // 1 entrée par billet, length = quantité totale
    // Acheteur invité (non connecté)
    guestEmail?: string;
    guestName?: string;
    // Code promo partenaire (influenceur), optionnel
    promoCode?: string;
    // Paiement Mobile Money (requis si le montant n'est pas 0)
    phoneNumber?: string;
    network?: FeexpayNetwork;
};

export async function initiateTicketPayment(input: PaymentInput) {
    const sessionUser = await getCurrentUser();

    // ── Identification de l'acheteur ──────────────────────────────────────
    let buyerEmail: string;
    let buyerName: string | undefined;
    let dbUserId: string | undefined;

    if (sessionUser) {
        buyerEmail = sessionUser.email;
        buyerName = sessionUser.name;
        dbUserId = sessionUser.id;
    } else {
        const email = input.guestEmail?.trim().toLowerCase() ?? "";
        const name = input.guestName?.trim() ?? "";
        if (!email) return { error: "Votre adresse email est requise pour continuer." };
        if (!EMAIL_RE.test(email)) return { error: "Adresse email invalide." };
        if (!name) return { error: "Votre nom est requis pour continuer." };
        buyerEmail = email;
        buyerName = name;
    }

    // ── Validation des assignements ───────────────────────────────────────
    const { ticketId, assignments } = input;
    const quantity = assignments.length;

    if (!ticketId) return { error: "Billet invalide." };
    if (quantity < 1 || quantity > 10) return { error: "Quantité invalide (1 à 10)." };

    for (const [i, a] of assignments.entries()) {
        if (!a.forSelf) {
            if (!a.name?.trim()) {
                return { error: `Le nom du bénéficiaire est requis pour le billet ${i + 1}.` };
            }
            if (a.email?.trim() && !EMAIL_RE.test(a.email.trim())) {
                return { error: `Email invalide pour le billet ${i + 1}.` };
            }
        }
    }

    // ── Récupération du ticket ────────────────────────────────────────────
    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
            event: {
                select: { id: true, title: true, slug: true, isDeleted: true },
            },
        },
    });

    if (!ticket) return { error: "Billet introuvable." };
    if (ticket.event.isDeleted) return { error: "Cet événement n'est plus disponible." };

    // ── Construction des OrderItems (1 par billet) ────────────────────────
    const orderItemsData = assignments.map(a => ({
        quantity: 1,
        price: ticket.price,
        ticketId: ticket.id,
        attendeeName: a.forSelf ? (buyerName ?? null) : (a.name?.trim() ?? null),
        attendeeEmail: a.forSelf ? buyerEmail : (a.email?.trim().toLowerCase() ?? null),
    }));

    const baseAmount = ticket.price * quantity;

    // ── Code promo partenaire (optionnel) ─────────────────────────────────
    let eventPartnerId: string | null = null;
    let discountAmount = 0;
    if (input.promoCode?.trim()) {
        const promoRes = await validatePromoCode(ticket.event.id, input.promoCode);
        if (!promoRes.success) {
            return { error: promoRes.error ?? "Code promo invalide." };
        }
        eventPartnerId = promoRes.partnerId;
        discountAmount =
            promoRes.discountType === "PERCENTAGE"
                ? Math.round(baseAmount * (promoRes.discountValue / 100))
                : Math.min(baseAmount, promoRes.discountValue);
    }

    const discountedBase = Math.max(0, baseAmount - discountAmount);
    const totalAmount = discountedBase;
    const isFree = discountedBase === 0;

    // ── Validation Mobile Money (requise pour un billet payant) ───────────
    let network: FeexpayNetwork | undefined;
    let fullPhoneNumber: string | undefined;
    if (!isFree) {
        if (!input.network || !isValidNetwork(input.network)) {
            return { error: "Sélectionnez un opérateur mobile money." };
        }
        const netInfo = getNetwork(input.network);
        const localDigits = (input.phoneNumber ?? "").replace(/\D/g, "");
        if (!netInfo || !isValidLocalNumber(localDigits, netInfo.countryCode)) {
            return { error: "Numéro de téléphone invalide." };
        }
        network = input.network;
        fullPhoneNumber = `${netInfo.dialCode}${localDigits}`;
    }

    // ── Vérification du stock + création de commande (transaction) ───────
    // Verrou sur la ligne du ticket (FOR UPDATE) : les achats concurrents du
    // même billet sont sérialisés → aucune survente possible.
    const txResult = await prisma.$transaction(async (tx) => {
        if (ticket.totalStock !== null) {
            await tx.$queryRaw`SELECT id FROM "Ticket" WHERE id = ${ticket.id} FOR UPDATE`;
            // Une commande PENDING ne réserve le stock que 20 min : un push
            // Mobile Money FeexPay se résout en quelques minutes (USSD), donc
            // un paiement abandonné ne doit pas geler les places longtemps.
            const pendingCutoff = new Date(Date.now() - 20 * 60 * 1000);
            const sold = await tx.orderItem.aggregate({
                where: {
                    ticketId: ticket.id,
                    order: {
                        OR: [
                            { status: "COMPLETED" },
                            {
                                status: "PENDING",
                                createdAt: { gte: pendingCutoff },
                            },
                        ],
                    },
                },
                _sum: { quantity: true },
            });
            const remaining = ticket.totalStock - (sold._sum.quantity ?? 0);
            if (remaining < quantity) {
                return { insufficientStock: Math.max(remaining, 0) };
            }
        }

        const order = await tx.order.create({
            data: {
                reference: generateReference(),
                status: isFree ? "COMPLETED" : "PENDING",
                totalAmount: isFree ? 0 : totalAmount,
                ...(dbUserId
                    ? { userId: dbUserId }
                    : { guestEmail: buyerEmail, guestName: buyerName }),
                eventId: ticket.event.id,
                eventPartnerId,
                discountAmount,
                payerPhone: fullPhoneNumber,
                payerNetwork: network,
                items: { create: orderItemsData },
            },
            include: {
                items: true,
                event: {
                    select: {
                        title: true,
                        startDate: true,
                        location: true,
                        eventType: true,
                        slug: true,
                    },
                },
            },
        });

        return { order };
    });

    if ("insufficientStock" in txResult) {
        return {
            error: `Stock insuffisant. Il ne reste que ${txResult.insufficientStock} place(s).`,
        };
    }

    const order = txResult.order;

    // ── Billet gratuit ────────────────────────────────────────────────────
    if (isFree) {
        sendOrderConfirmationEmails(order.id).catch((err) =>
            console.error("Free ticket email error:", err),
        );

        revalidatePath(`/events/${order.event.slug}`);
        return { success: true, isFree: true, orderId: order.id };
    }

    // ── Billet payant (FeexPay — Mobile Money) ────────────────────────────
    try {
        const paymentRes = await createPayment({
            amount: totalAmount,
            phoneNumber: fullPhoneNumber!,
            network: network!,
            description: `${ticket.title} × ${quantity} — ${ticket.event.title}`,
            callbackInfo: encodeCallbackInfo("order", order.id),
        });

        await prisma.order.update({
            where: { id: order.id },
            data: { providerReference: paymentRes.reference },
        });

        return { success: true, isFree: false, orderId: order.id };
    } catch (err) {
        console.error("FeexPay error:", err);
        await prisma.order.update({
            where: { id: order.id },
            data: { status: "FAILED" },
        });
        const reason = err instanceof Error ? err.message : null;
        return {
            error: reason
                ? `Paiement refusé : ${reason}`
                : "Service de paiement indisponible. Veuillez réessayer.",
        };
    }
}

// ─────────────────────────────────────────────
// getOrderPaymentStatus — polling client pendant l'attente de confirmation
// Mobile Money. Revérifie activement auprès de FeexPay si la commande est
// encore PENDING : le webhook peut mettre du temps (ou échouer à être
// livré), et le cron de réconciliation ne tourne qu'1x/jour (limite Vercel
// Hobby) — c'est donc ce polling, actif pendant que l'acheteur patiente,
// qui garantit une résolution rapide dans l'immense majorité des cas.
// ─────────────────────────────────────────────

export async function getOrderPaymentStatus(orderId: string) {
    try {
        const status = await reconcileOrderPayment(orderId);
        return { status };
    } catch {
        return { error: "Commande introuvable." };
    }
}

export async function getUserOrders() {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) return { orders: [] };

    const orders = await prisma.order.findMany({
        where: { userId: sessionUser.id },
        include: {
            event: {
                select: { title: true, slug: true, imageUrl: true, startDate: true },
            },
            items: {
                include: { ticket: { select: { title: true } } },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return { orders };
}

// ─────────────────────────────────────────────
// markOrderRefunded — remboursement traité manuellement (GeniusPay n'expose
// pas d'API de remboursement programmatique ; l'organisateur/admin l'effectue
// hors plateforme puis confirme ici, ce qui déclenche l'email de confirmation)
// ─────────────────────────────────────────────

export async function markOrderRefunded(orderId: string) {
    const user = await getCurrentUser();
    if (!user) return { error: "Non authentifié" };

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            event: { select: { id: true, title: true, organizerId: true } },
            user: { select: { email: true, name: true } },
        },
    });
    if (!order) return { error: "Commande introuvable" };

    if (user.role !== "ADMIN" && order.event.organizerId !== user.id) {
        return { error: "Accès refusé" };
    }

    if (order.status !== "COMPLETED") {
        return { error: "Seule une commande payée peut être marquée remboursée" };
    }

    await prisma.order.update({
        where: { id: order.id },
        data: { status: "REFUNDED" },
    });

    const email = order.user?.email ?? order.guestEmail;
    const name = order.user?.name ?? order.guestName ?? "Client";
    if (email) {
        sendRefundConfirmationEmail({
            to: email,
            recipientName: name,
            eventTitle: order.event.title,
            orderReference: order.reference,
            totalAmount: order.totalAmount,
        }).catch((err) => console.error("Refund confirmation email error:", err));
    }

    revalidatePath(`/dashboard/events/${order.event.id}`);
    return { success: true };
}

// ─────────────────────────────────────────────
// getOrdersToRefund — commandes payées d'un évènement annulé, pas encore remboursées
// ─────────────────────────────────────────────

export async function getOrdersToRefund(eventId: string) {
    const user = await getCurrentUser();
    if (!user) return { error: "Non authentifié", orders: [] };

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { organizerId: true },
    });
    if (!event) return { error: "Évènement introuvable", orders: [] };
    if (user.role !== "ADMIN" && event.organizerId !== user.id) {
        return { error: "Accès refusé", orders: [] };
    }

    const orders = await prisma.order.findMany({
        where: { eventId, status: { in: ["COMPLETED", "REFUNDED"] } },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" },
    });

    return { orders };
}
