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
import { stockConsumingOrderFilter } from "@/lib/stock";
import { MAX_TICKETS_PER_ORDER } from "@/lib/cart";
import { rateLimit } from "@/lib/rate-limit";
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

/** Une catégorie de billet et les personnes à qui ses exemplaires sont attribués. */
export type CartLine = {
    ticketId: string;
    assignments: TicketAssignment[]; // 1 entrée par billet, length = quantité de la ligne
};

export type PaymentInput = {
    // Panier : plusieurs catégories de billets d'un même évènement.
    items: CartLine[];
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

    // ── Validation de la structure du panier ──────────────────────────────
    const lines = input.items ?? [];
    if (lines.length === 0) return { error: "Votre panier est vide." };

    // Un même billet ne doit apparaître qu'une fois : sinon le verrou et le
    // contrôle de stock porteraient sur des quantités partielles.
    const ticketIds = lines.map((l) => l.ticketId);
    if (ticketIds.some((id) => !id)) return { error: "Billet invalide." };
    if (new Set(ticketIds).size !== ticketIds.length) {
        return { error: "Panier invalide : un billet est présent en double." };
    }

    const totalQuantity = lines.reduce((n, l) => n + l.assignments.length, 0);
    if (totalQuantity < 1 || totalQuantity > MAX_TICKETS_PER_ORDER) {
        return {
            error: `Quantité invalide (1 à ${MAX_TICKETS_PER_ORDER} billets par commande).`,
        };
    }

    for (const line of lines) {
        if (line.assignments.length === 0) {
            return { error: "Une ligne du panier est vide." };
        }
        for (const [i, a] of line.assignments.entries()) {
            if (a.forSelf) continue;
            if (!a.name?.trim()) {
                return { error: `Le nom du bénéficiaire est requis pour le billet ${i + 1}.` };
            }
            if (a.email?.trim() && !EMAIL_RE.test(a.email.trim())) {
                return { error: `Email invalide pour le billet ${i + 1}.` };
            }
        }
    }

    // ── Récupération des billets ──────────────────────────────────────────
    const tickets = await prisma.ticket.findMany({
        where: { id: { in: ticketIds } },
        include: {
            event: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    isDeleted: true,
                    isPublished: true,
                    isCancelled: true,
                    endDate: true,
                },
            },
        },
    });

    if (tickets.length !== ticketIds.length) {
        return { error: "Billet introuvable." };
    }

    // Une commande porte un seul `eventId` : tous les billets doivent
    // appartenir au même évènement.
    const event = tickets[0].event;
    if (tickets.some((t) => t.event.id !== event.id)) {
        return {
            error: "Tous les billets d'une commande doivent appartenir au même évènement.",
        };
    }

    // L'UI masque déjà ces cas, mais l'action est appelable directement :
    // la vente doit être refusée côté serveur.
    if (event.isDeleted || !event.isPublished) {
        return { error: "Cet évènement n'est plus disponible." };
    }
    if (event.isCancelled) {
        return { error: "Cet évènement a été annulé." };
    }
    if (event.endDate.getTime() < Date.now()) {
        return { error: "Cet évènement est terminé." };
    }

    const ticketById = new Map(tickets.map((t) => [t.id, t]));

    // ── Construction des OrderItems (1 par billet) ────────────────────────
    const orderItemsData = lines.flatMap((line) => {
        const ticket = ticketById.get(line.ticketId)!;
        return line.assignments.map((a) => ({
            quantity: 1,
            price: ticket.price,
            ticketId: ticket.id,
            attendeeName: a.forSelf ? (buyerName ?? null) : (a.name?.trim() ?? null),
            attendeeEmail: a.forSelf ? buyerEmail : (a.email?.trim().toLowerCase() ?? null),
        }));
    });

    const baseAmount = lines.reduce(
        (sum, line) =>
            sum + ticketById.get(line.ticketId)!.price * line.assignments.length,
        0,
    );

    // ── Code promo partenaire (optionnel) ─────────────────────────────────
    let eventPartnerId: string | null = null;
    let discountAmount = 0;
    if (input.promoCode?.trim()) {
        const promoRes = await validatePromoCode(event.id, input.promoCode);
        if (!promoRes.success) {
            return { error: promoRes.error ?? "Code promo invalide." };
        }
        eventPartnerId = promoRes.partnerId;
        discountAmount =
            promoRes.discountType === "PERCENTAGE"
                ? Math.round(baseAmount * (promoRes.discountValue / 100))
                : Math.min(baseAmount, promoRes.discountValue);
    }

    const totalAmount = Math.max(0, baseAmount - discountAmount);
    const isFree = totalAmount === 0;

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
    // Verrou (FOR UPDATE) sur chaque ligne Ticket concernée : les achats
    // concurrents sont sérialisés → aucune survente possible.
    //
    // Les ids sont TRIÉS : deux acheteurs prenant les mêmes catégories dans un
    // ordre différent s'interbloqueraient sinon (A verrouille T1 et attend T2,
    // B verrouille T2 et attend T1).
    const lockIds = [...ticketIds].sort();

    const txResult = await prisma.$transaction(async (tx) => {
        for (const ticketId of lockIds) {
            const ticket = ticketById.get(ticketId)!;
            if (ticket.totalStock === null) continue;

            await tx.$queryRaw`SELECT id FROM "Ticket" WHERE id = ${ticketId} FOR UPDATE`;

            const sold = await tx.orderItem.aggregate({
                where: { ticketId, order: stockConsumingOrderFilter() },
                _sum: { quantity: true },
            });

            const wanted = lines.find((l) => l.ticketId === ticketId)!.assignments
                .length;
            const remaining = ticket.totalStock - (sold._sum.quantity ?? 0);
            if (remaining < wanted) {
                // Nommer la catégorie : avec plusieurs lignes, « stock
                // insuffisant » seul ne dit pas laquelle corriger.
                return {
                    insufficientStock: {
                        title: ticket.title,
                        remaining: Math.max(remaining, 0),
                    },
                };
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
                eventId: event.id,
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

    if ("insufficientStock" in txResult && txResult.insufficientStock) {
        const { title, remaining } = txResult.insufficientStock;
        return {
            error:
                remaining === 0
                    ? `« ${title} » est complet.`
                    : `Stock insuffisant pour « ${title} » : il ne reste que ${remaining} place(s).`,
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

    // ── Commande payante (FeexPay — Mobile Money) ─────────────────────────
    try {
        // FeexPay tronque les descriptions longues : avec plusieurs
        // catégories, on résume plutôt que d'énumérer.
        const description =
            lines.length === 1
                ? `${ticketById.get(lines[0].ticketId)!.title} × ${totalQuantity} — ${event.title}`
                : `${totalQuantity} billets — ${event.title}`;

        const paymentRes = await createPayment({
            amount: totalAmount,
            phoneNumber: fullPhoneNumber!,
            network: network!,
            description,
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

// ─────────────────────────────────────────────
// resendOrderTickets — renvoi des billets à l'acheteur
//
// Un envoi Resend peut échouer alors que le paiement est confirmé : sans
// action de renvoi, l'acheteur n'avait aucun recours et le support non plus.
// ─────────────────────────────────────────────

export async function resendOrderTickets(orderId: string) {
    const user = await getCurrentUser();
    if (!user) return { error: "Vous devez être connecté." };

    // Un renvoi déclenche un email et regénère les PDF : on borne les abus.
    if (!rateLimit(`resend-tickets:${user.id}`, 5, 60 * 60 * 1000)) {
        return {
            error: "Trop de renvois demandés. Réessayez dans une heure.",
        };
    }

    const order = await prisma.order.findFirst({
        where: { id: orderId, userId: user.id },
        select: { id: true, status: true },
    });

    if (!order) return { error: "Commande introuvable." };
    if (order.status !== "COMPLETED") {
        return { error: "Cette commande n'est pas confirmée." };
    }

    try {
        await sendOrderConfirmationEmails(order.id);
    } catch {
        return {
            error: "L'envoi a échoué. Réessayez dans quelques minutes.",
        };
    }

    revalidatePath("/mes-billets");
    return { success: true };
}
