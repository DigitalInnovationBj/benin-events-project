"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function getSettings() {
    return prisma.platformSettings.upsert({
        where: { id: "singleton" },
        create: {
            id: "singleton",
            commissionRate: 0,
            eventCreationFeeEnabled: false,
            eventCreationFee: 5000,
            featuredEventFeeEnabled: false,
            featuredEventFee: 5000,
        },
        update: {},
    });
}

export async function updateCommissionRate(rate: number) {
    await requireAdmin();

    if (rate < 0 || rate > 100) throw new Error("Taux invalide (0–100)");

    await prisma.platformSettings.upsert({
        where: { id: "singleton" },
        create: { id: "singleton", commissionRate: rate },
        update: { commissionRate: rate },
    });

    revalidatePath("/admin/settings");
}

/** Taux de commission (%) sur les billets physiques vendus. */
export async function updatePhysicalCommissionRate(rate: number) {
    await requireAdmin();

    if (rate < 0 || rate > 100) throw new Error("Taux invalide (0–100)");

    await prisma.platformSettings.upsert({
        where: { id: "singleton" },
        create: { id: "singleton", commissionRate: 0, physicalCommissionRate: rate },
        update: { physicalCommissionRate: rate },
    });

    revalidatePath("/admin/settings");
}

export async function updatePlatformFees(data: {
    eventCreationFeeEnabled: boolean;
    eventCreationFee: number;
    featuredEventFeeEnabled: boolean;
    featuredEventFee: number;
}) {
    await requireAdmin();

    if (data.eventCreationFee < 0) throw new Error("Montant invalide");
    if (data.featuredEventFee < 0) throw new Error("Montant invalide");

    await prisma.platformSettings.upsert({
        where: { id: "singleton" },
        create: { id: "singleton", commissionRate: 0, ...data },
        update: data,
    });

    revalidatePath("/admin/settings");
}
