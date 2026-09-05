"use server";

import { getCurrentUser } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import {
    createPayment,
    encodeCallbackInfo,
    getNetwork,
    isValidNetwork,
    type FeexpayNetwork,
} from "@/lib/feexpay";
import { reconcilePlatformPayment } from "@/lib/payment-reconciliation";
import { revalidatePath } from "next/cache";

export interface FeaturedEventPaymentInput {
    eventId: string;
    phoneNumber: string;
    network: FeexpayNetwork;
}

export async function initiateFeaturedEventPayment(input: FeaturedEventPaymentInput) {
    const dbUser = await getCurrentUser();
    if (!dbUser) return { error: "Non authentifié" };
    if (dbUser.role !== "ORGANIZER") return { error: "Réservé aux organisateurs" };

    if (!isValidNetwork(input.network)) {
        return { error: "Sélectionnez un opérateur mobile money." };
    }
    const netInfo = getNetwork(input.network);
    const localDigits = input.phoneNumber.replace(/\D/g, "");
    if (!netInfo || localDigits.length < 6) {
        return { error: "Numéro de téléphone invalide." };
    }
    const fullPhoneNumber = `${netInfo.dialCode}${localDigits}`;

    const event = await prisma.event.findUnique({
        where: { id: input.eventId },
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
            payerPhone: fullPhoneNumber,
            payerNetwork: input.network,
        },
    });

    try {
        const paymentRes = await createPayment({
            amount,
            phoneNumber: fullPhoneNumber,
            network: input.network,
            description: `Mise en vedette — ${event.title}`,
            callbackInfo: encodeCallbackInfo("platform", platformPayment.id),
        });

        await prisma.platformPayment.update({
            where: { id: platformPayment.id },
            data: { providerReference: paymentRes.reference },
        });

        return { success: true, platformPaymentId: platformPayment.id };
    } catch (err) {
        console.error("FeexPay featured event error:", err);
        await prisma.platformPayment.update({
            where: { id: platformPayment.id },
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

// Revérifie activement auprès de FeexPay si le paiement est encore PENDING —
// voir le commentaire de getOrderPaymentStatus (payment.actions.ts) : c'est
// ce polling qui garantit une résolution rapide, le cron ne tournant qu'1x/jour.
export async function getPlatformPaymentStatus(platformPaymentId: string) {
    try {
        const status = await reconcilePlatformPayment(platformPaymentId);
        if (status === "COMPLETED") {
            revalidatePath("/dashboard/events");
            revalidatePath("/");
        }
        return { status };
    } catch {
        return { error: "Paiement introuvable." };
    }
}
