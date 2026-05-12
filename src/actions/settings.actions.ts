"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
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
    const user = await currentUser();
    if (!user) throw new Error("Non authentifié");

    const dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } });
    if (dbUser?.role !== "ADMIN") throw new Error("Accès refusé");

    if (rate < 0 || rate > 100) throw new Error("Taux invalide (0–100)");

    await prisma.platformSettings.upsert({
        where: { id: "singleton" },
        create: { id: "singleton", commissionRate: rate },
        update: { commissionRate: rate },
    });

    revalidatePath("/admin/settings");
}

export async function updatePlatformFees(data: {
    eventCreationFeeEnabled: boolean;
    eventCreationFee: number;
    featuredEventFeeEnabled: boolean;
    featuredEventFee: number;
}) {
    const user = await currentUser();
    if (!user) throw new Error("Non authentifié");

    const dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } });
    if (dbUser?.role !== "ADMIN") throw new Error("Accès refusé");

    if (data.eventCreationFee < 0) throw new Error("Montant invalide");
    if (data.featuredEventFee < 0) throw new Error("Montant invalide");

    await prisma.platformSettings.upsert({
        where: { id: "singleton" },
        create: { id: "singleton", commissionRate: 0, ...data },
        update: data,
    });

    revalidatePath("/admin/settings");
}
