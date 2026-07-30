"use server";

import { getCurrentUser } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { createPayment } from "@/lib/geniuspay";
import { sendOrderConfirmationEmail, sendTicketGiftEmail, sendRefundConfirmationEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function computeFees(base: number): number {
    if (base === 0) return 0;
    return Math.ceil(base * 0.05) + 100;
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
    const fees = computeFees(baseAmount);
    const totalAmount = baseAmount + fees;
    const isFree = baseAmount === 0;

    // ── Vérification du stock + création de commande (transaction) ───────
    // Verrou sur la ligne du ticket (FOR UPDATE) : les achats concurrents du
    // même billet sont sérialisés → aucune survente possible.
    const txResult = await prisma.$transaction(async (tx) => {
        if (ticket.totalStock !== null) {
            await tx.$queryRaw`SELECT id FROM "Ticket" WHERE id = ${ticket.id} FOR UPDATE`;
            // Une commande PENDING ne réserve le stock que pendant 1 h : les
            // paiements abandonnés dont GeniusPay n'a jamais notifié
            // l'expiration ne gèlent pas les places indéfiniment.
            const pendingCutoff = new Date(Date.now() - 60 * 60 * 1000);
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
                reference: isFree
                    ? `FREE-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
                    : `TMP-${Date.now()}`,
                status: isFree ? "COMPLETED" : "PENDING",
                totalAmount: isFree ? 0 : totalAmount,
                ...(dbUserId
                    ? { userId: dbUserId }
                    : { guestEmail: buyerEmail, guestName: buyerName }),
                eventId: ticket.event.id,
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

        const eventDate = new Date(order.event.startDate).toLocaleDateString("fr-FR", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
            hour: "2-digit", minute: "2-digit", timeZone: "Africa/Porto-Novo",
        });

        sendOrderConfirmationEmail({
            to: buyerEmail,
            customerName: buyerName ?? "Client",
            eventTitle: order.event.title,
            eventDate,
            eventLocation: order.event.location,
            eventType: order.event.eventType,
            orderReference: order.reference,
            totalAmount: 0,
            items: order.items.map(item => ({
                id: item.id,
                ticketTitle: ticket.title,
                quantity: 1,
                price: 0,
                emailTemplate: ticket.emailTemplate,
            })),
        }).catch(err => console.error("Free ticket email error:", err));

        // Emails cadeaux pour les bénéficiaires distincts de l'acheteur
        const giftItems = order.items.filter(
            (item) => item.attendeeEmail && item.attendeeEmail !== buyerEmail,
        );
        Promise.allSettled(
            giftItems.map((item) =>
                sendTicketGiftEmail({
                    to: item.attendeeEmail!,
                    recipientName: item.attendeeName ?? "Invité",
                    senderName: buyerName ?? "Un ami",
                    eventTitle: order.event.title,
                    eventDate,
                    eventLocation: order.event.location,
                    eventType: order.event.eventType,
                    ticketTitle: ticket.title,
                    price: 0,
                    emailTemplate: ticket.emailTemplate,
                    orderItemId: item.id,
                    orderReference: order.reference,
                }),
            ),
        ).catch(err => console.error("Gift email error:", err));

        revalidatePath(`/events/${order.event.slug}`);
        return {
            success: true,
            redirectUrl: `${APP_URL}/checkout/success?orderId=${order.id}`,
        };
    }

    // ── Billet payant ─────────────────────────────────────────────────────
    try {
        const paymentRes = await createPayment({
            amount: totalAmount,
            description: `${ticket.title} × ${quantity} — ${ticket.event.title}`,
            customer: { name: buyerName, email: buyerEmail },
            success_url: `${APP_URL}/checkout/success?orderId=${order.id}`,
            error_url: `${APP_URL}/checkout/error?orderId=${order.id}`,
            metadata: {
                order_id: order.id,
                ticket_id: ticket.id,
                quantity: String(quantity),
                ...(dbUserId ? { user_id: dbUserId } : { guest_email: buyerEmail }),
            },
        });

        const { reference, checkout_url, id: geniuspayId } = paymentRes.data;

        await prisma.order.update({
            where: { id: order.id },
            data: { reference, geniuspayId, checkoutUrl: checkout_url },
        });

        return { success: true, redirectUrl: checkout_url };
    } catch (err) {
        console.error("GeniusPay error:", err);
        await prisma.order.update({
            where: { id: order.id },
            data: { status: "FAILED" },
        });
        return { error: "Service de paiement indisponible. Veuillez réessayer." };
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
