"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { createPayment } from "@/lib/geniuspay";
import { sendOrderConfirmationEmail, sendTicketGiftEmail } from "@/lib/email";
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
    const { userId } = await auth();

    // ── Identification de l'acheteur ──────────────────────────────────────
    let buyerEmail: string;
    let buyerName: string | undefined;
    let dbUserId: string | undefined;

    if (userId) {
        const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!dbUser) return { error: "Utilisateur introuvable." };
        buyerEmail = dbUser.email;
        buyerName = dbUser.name ?? undefined;
        dbUserId = dbUser.id;
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

    // ── Vérification du stock ─────────────────────────────────────────────
    if (ticket.totalStock !== null) {
        const sold = await prisma.orderItem.aggregate({
            where: {
                ticketId: ticket.id,
                order: { status: { in: ["COMPLETED", "PENDING"] } },
            },
            _sum: { quantity: true },
        });
        const remaining = ticket.totalStock - (sold._sum.quantity ?? 0);
        if (remaining < quantity) {
            return { error: `Stock insuffisant. Il ne reste que ${remaining} place(s).` };
        }
    }

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

    // ── Billet gratuit ────────────────────────────────────────────────────
    if (baseAmount === 0) {
        const order = await prisma.order.create({
            data: {
                reference: `FREE-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                status: "COMPLETED",
                totalAmount: 0,
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
    const order = await prisma.order.create({
        data: {
            reference: `TMP-${Date.now()}`,
            status: "PENDING",
            totalAmount,
            ...(dbUserId
                ? { userId: dbUserId }
                : { guestEmail: buyerEmail, guestName: buyerName }),
            eventId: ticket.event.id,
            items: { create: orderItemsData },
        },
    });

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
    const { userId } = await auth();
    if (!userId) return { orders: [] };

    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser) return { orders: [] };

    const orders = await prisma.order.findMany({
        where: { userId: dbUser.id },
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
