"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { createPayment } from "@/lib/geniuspay";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Frais de service : 5 % du montant + 100 F fixe
function computeFees(base: number): number {
    if (base === 0) return 0;
    return Math.ceil(base * 0.05) + 100;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Attendee = { name?: string; email?: string };

export type PaymentInput = {
    ticketId: string;
    quantity: number;
    // Champs invité (quand non authentifié)
    guestEmail?: string;
    guestName?: string;
    // Un participant optionnel par billet
    attendees?: Attendee[];
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

    // ── Validation de la saisie ───────────────────────────────────────────
    const { ticketId, quantity, attendees } = input;
    if (!ticketId) return { error: "Billet invalide." };
    if (isNaN(quantity) || quantity < 1 || quantity > 10) {
        return { error: "Quantité invalide (1 à 10)." };
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

    // ── Construction des lignes de commande ───────────────────────────────
    // Si des participants nommés sont fournis → un OrderItem par participant (quantité = 1)
    // Sinon → un seul OrderItem avec la quantité totale
    const hasNamedAttendees = attendees?.some(a => a?.name?.trim() || a?.email?.trim());

    type ItemData = {
        quantity: number;
        price: number;
        ticketId: string;
        attendeeName?: string | null;
        attendeeEmail?: string | null;
    };

    let orderItemsData: ItemData[];

    if (hasNamedAttendees && attendees) {
        orderItemsData = attendees.slice(0, quantity).map(a => ({
            quantity: 1,
            price: ticket.price,
            ticketId: ticket.id,
            attendeeName: a?.name?.trim() || null,
            attendeeEmail: a?.email?.trim().toLowerCase() || null,
        }));
    } else {
        orderItemsData = [{ quantity, price: ticket.price, ticketId: ticket.id }];
    }

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

        sendOrderConfirmationEmail({
            to: buyerEmail,
            customerName: buyerName ?? "Client",
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
            totalAmount: 0,
            items: order.items.map((item) => ({
                id: item.id,
                ticketTitle: ticket.title,
                quantity: item.quantity,
                price: 0,
            })),
        }).catch((err) => console.error("Free ticket email error:", err));

        revalidatePath(`/events/${order.event.slug}`);
        return {
            success: true,
            redirectUrl: `${APP_URL}/checkout/success?orderId=${order.id}`,
        };
    }

    // ── Billet payant : créer la commande PENDING puis appeler GeniusPay ──
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
            customer: {
                name: buyerName,
                email: buyerEmail,
            },
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
        console.error("GeniusPay initiateTicketPayment error:", err);
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
                select: {
                    title: true,
                    slug: true,
                    imageUrl: true,
                    startDate: true,
                },
            },
            items: {
                include: { ticket: { select: { title: true } } },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return { orders };
}
