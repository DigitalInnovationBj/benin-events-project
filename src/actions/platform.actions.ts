"use server";

import { getCurrentUser } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { createPayment } from "@/lib/geniuspay";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function initiateFeaturedEventPayment(eventId: string) {
    const dbUser = await getCurrentUser();
    if (!dbUser) return { error: "Non authentifié" };
    if (dbUser.role !== "ORGANIZER") return { error: "Réservé aux organisateurs" };

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, title: true, organizerId: true, isFeatured: true },
    });
    if (!event) return { error: "Évènement introuvable" };
    if (event.organizerId !== dbUser.id) return { error: "Accès refusé" };
    if (event.isFeatured) return { error: "Cet évènement est déjà en vedette" };

    const settings = await prisma.platformSettings.upsert({
        where: { id: "singleton" },
        create: { id: "singleton", commissionRate: 0, featuredEventFeeEnabled: false, featuredEventFee: 5000, eventCreationFeeEnabled: false, eventCreationFee: 5000 },
        update: {},
    });

    if (!settings.featuredEventFeeEnabled) return { error: "La mise en vedette payante n'est pas activée" };

    const amount = settings.featuredEventFee;

    const platformPayment = await prisma.platformPayment.create({
        data: {
            type: "EVENT_FEATURED",
            status: "PENDING",
            amount,
            eventId: event.id,
            userId: dbUser.id,
        },
    });

    try {
        const paymentRes = await createPayment({
            amount,
            description: `Mise en vedette — ${event.title}`,
            customer: { name: dbUser.name ?? undefined, email: dbUser.email },
            success_url: `${APP_URL}/dashboard/events/${event.id}?featured=1`,
            error_url: `${APP_URL}/dashboard/events/${event.id}?featured_error=1`,
            metadata: {
                payment_context: "platform",
                platform_payment_id: platformPayment.id,
                platform_payment_type: "EVENT_FEATURED",
                event_id: event.id,
            },
        });

        const { reference, checkout_url, id: geniuspayId } = paymentRes.data;

        await prisma.platformPayment.update({
            where: { id: platformPayment.id },
            data: { reference, geniuspayId, checkoutUrl: checkout_url },
        });

        return { success: true, redirectUrl: checkout_url };
    } catch (err) {
        console.error("GeniusPay featured event error:", err);
        await prisma.platformPayment.update({
            where: { id: platformPayment.id },
            data: { status: "FAILED" },
        });
        return { error: "Service de paiement indisponible. Veuillez réessayer." };
    }
}
