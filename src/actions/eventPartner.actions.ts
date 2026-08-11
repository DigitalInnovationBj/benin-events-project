"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

function normalizeCode(code: string): string {
    return code.trim().toUpperCase().replace(/\s+/g, "");
}

async function assertEventOwner(eventId: string) {
    const dbUser = await getCurrentUser();
    if (!dbUser) return { error: "Non authentifié." } as const;
    if (dbUser.role !== "ORGANIZER" && dbUser.role !== "ADMIN") {
        return { error: "Permission refusée." } as const;
    }
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, organizerId: true },
    });
    if (!event) return { error: "Évènement introuvable." } as const;
    if (dbUser.role !== "ADMIN" && event.organizerId !== dbUser.id) {
        return { error: "Vous n'êtes pas le propriétaire de cet évènement." } as const;
    }
    return { event } as const;
}

// ─────────────────────────────────────────────
// createEventPartner
// ─────────────────────────────────────────────

const createSchema = z.object({
    eventId: z.string().min(1),
    name: z.string().min(2, "Le nom est trop court").max(80),
    code: z.string().min(3, "Le code doit faire au moins 3 caractères").max(30),
    discountType: z.enum(["PERCENTAGE", "FIXED"]),
    discountValue: z.number().positive("La valeur doit être positive"),
});

export async function createEventPartner(input: z.infer<typeof createSchema>) {
    try {
        const parsed = createSchema.safeParse(input);
        if (!parsed.success) {
            return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
        }
        const data = parsed.data;

        if (data.discountType === "PERCENTAGE" && data.discountValue > 100) {
            return { error: "Un pourcentage ne peut pas dépasser 100." };
        }

        const guard = await assertEventOwner(data.eventId);
        if ("error" in guard) return guard;

        const code = normalizeCode(data.code);
        if (!/^[A-Z0-9_-]+$/.test(code)) {
            return { error: "Le code ne peut contenir que des lettres, chiffres, - et _." };
        }

        const existing = await prisma.eventPartner.findUnique({
            where: { eventId_code: { eventId: data.eventId, code } },
        });
        if (existing) return { error: "Ce code est déjà utilisé pour cet évènement." };

        await prisma.eventPartner.create({
            data: {
                eventId: data.eventId,
                name: data.name.trim(),
                code,
                discountType: data.discountType,
                discountValue: data.discountValue,
            },
        });

        revalidatePath(`/dashboard/events/${data.eventId}`);
        return { success: true };
    } catch (error) {
        console.error("Erreur createEventPartner:", error);
        return { error: "Erreur interne." };
    }
}

// ─────────────────────────────────────────────
// toggleEventPartnerActive
// ─────────────────────────────────────────────

export async function toggleEventPartnerActive(partnerId: string, isActive: boolean) {
    try {
        const partner = await prisma.eventPartner.findUnique({
            where: { id: partnerId },
            select: { id: true, eventId: true },
        });
        if (!partner) return { error: "Partenaire introuvable." };

        const guard = await assertEventOwner(partner.eventId);
        if ("error" in guard) return guard;

        await prisma.eventPartner.update({ where: { id: partnerId }, data: { isActive } });
        revalidatePath(`/dashboard/events/${partner.eventId}`);
        return { success: true };
    } catch (error) {
        console.error("Erreur toggleEventPartnerActive:", error);
        return { error: "Erreur interne." };
    }
}

// ─────────────────────────────────────────────
// listEventPartners — avec stats d'usage (ventes attribuées)
// ─────────────────────────────────────────────

export async function listEventPartners(eventId: string) {
    const guard = await assertEventOwner(eventId);
    if ("error" in guard) return { error: guard.error, partners: [] };

    const partners = await prisma.eventPartner.findMany({
        where: { eventId },
        orderBy: { createdAt: "desc" },
        include: {
            orders: {
                where: { status: "COMPLETED" },
                select: { totalAmount: true, discountAmount: true },
            },
        },
    });

    const withStats = partners.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        discountType: p.discountType,
        discountValue: p.discountValue,
        isActive: p.isActive,
        createdAt: p.createdAt,
        salesCount: p.orders.length,
        revenueGenerated: p.orders.reduce((sum, o) => sum + o.totalAmount, 0),
        totalDiscountGiven: p.orders.reduce((sum, o) => sum + o.discountAmount, 0),
    }));

    return { partners: withStats };
}

// ─────────────────────────────────────────────
// validatePromoCode — utilisé au checkout public (pas d'auth requise)
// ─────────────────────────────────────────────

export async function validatePromoCode(eventId: string, rawCode: string) {
    const code = normalizeCode(rawCode);
    if (!code) return { error: "Code requis." };

    const partner = await prisma.eventPartner.findUnique({
        where: { eventId_code: { eventId, code } },
    });

    if (!partner || !partner.isActive) {
        return { error: "Code promo invalide ou expiré." };
    }

    return {
        success: true,
        partnerId: partner.id,
        name: partner.name,
        discountType: partner.discountType,
        discountValue: partner.discountValue,
    };
}
