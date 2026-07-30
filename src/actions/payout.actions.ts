"use server";

import prisma from "@/lib/prisma";
import { requireOrganizer, requireAdmin } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { MobileMoneyOperator, PayoutMethodType, PayoutStatus } from "@prisma/client";
import {
    sendPayoutRequestAdminEmail,
    sendPayoutStatusEmail,
} from "@/lib/email";

// ── Résumé financier de l'organisateur ───────────────────────────────────────

export async function getPayoutSummary() {
    const organizer = await requireOrganizer();

    // Revenus bruts = somme des (prix × quantité) des commandes COMPLETED
    const orderItems = await prisma.orderItem.findMany({
        where: {
            order: {
                status: "COMPLETED",
                event: { organizerId: organizer.id },
            },
        },
        select: { price: true, quantity: true },
    });

    const totalGross = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // Montants déjà demandés (PENDING, PROCESSING, PAID)
    const requestedAgg = await prisma.payoutRequest.aggregate({
        where: {
            organizerId: organizer.id,
            status: { in: ["PENDING", "PROCESSING", "PAID"] },
        },
        _sum: { grossAmount: true },
    });

    const alreadyRequested = requestedAgg._sum.grossAmount ?? 0;
    const availableGross = Math.max(0, totalGross - alreadyRequested);

    const settings = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });
    const commissionRate = settings?.commissionRate ?? 0;
    const commissionAmount = Math.ceil(availableGross * commissionRate / 100);
    const netAvailable = Math.max(0, availableGross - commissionAmount);

    return {
        totalGross,
        alreadyRequested,
        availableGross,
        commissionRate,
        commissionAmount,
        netAvailable,
    };
}

// ── Méthode de paiement ───────────────────────────────────────────────────────

export async function getPayoutMethod() {
    const organizer = await requireOrganizer();
    return prisma.payoutMethod.findUnique({ where: { userId: organizer.id } });
}

export async function savePayoutMethod(data: {
    type: PayoutMethodType;
    operator?: MobileMoneyOperator;
    phoneNumber?: string;
    bankName?: string;
    accountName?: string;
    iban?: string;
}) {
    const organizer = await requireOrganizer();

    await prisma.payoutMethod.upsert({
        where: { userId: organizer.id },
        create: { userId: organizer.id, ...data },
        update: data,
    });

    revalidatePath("/dashboard/payout");
}

// ── Demande de reversement ────────────────────────────────────────────────────

export async function requestPayout() {
    const organizer = await requireOrganizer();

    const summary = await getPayoutSummary();
    if (summary.availableGross <= 0) throw new Error("Aucun solde disponible");

    const method = await prisma.payoutMethod.findUnique({ where: { userId: organizer.id } });
    if (!method) throw new Error("Ajoutez d'abord vos coordonnées de paiement");

    await prisma.payoutRequest.create({
        data: {
            organizerId: organizer.id,
            grossAmount: summary.availableGross,
            commissionRate: summary.commissionRate,
            commissionAmount: summary.commissionAmount,
            netAmount: summary.netAvailable,
            methodType: method.type,
            operator: method.operator,
            phoneNumber: method.phoneNumber,
            bankName: method.bankName,
            accountName: method.accountName,
            iban: method.iban,
        },
    });

    // Notifier l'admin + confirmer à l'organisateur
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true } });
    const adminEmails = admins.map((a) => a.email);

    await Promise.all([
        adminEmails.length > 0
            ? sendPayoutRequestAdminEmail({
                adminEmails,
                organizerName: organizer.name ?? organizer.email,
                organizerEmail: organizer.email,
                netAmount: summary.netAvailable,
                grossAmount: summary.availableGross,
                commissionRate: summary.commissionRate,
                methodType: method.type,
                operator: method.operator ?? undefined,
                phoneNumber: method.phoneNumber ?? undefined,
                bankName: method.bankName ?? undefined,
                accountName: method.accountName ?? undefined,
                iban: method.iban ?? undefined,
            })
            : Promise.resolve(),
        sendPayoutStatusEmail({
            to: organizer.email,
            organizerName: organizer.name ?? organizer.email,
            type: "REQUESTED",
            netAmount: summary.netAvailable,
            grossAmount: summary.availableGross,
            commissionRate: summary.commissionRate,
        }),
    ]);

    revalidatePath("/dashboard/payout");
}

// ── Historique organisateur ───────────────────────────────────────────────────

export async function getMyPayoutRequests() {
    const organizer = await requireOrganizer();
    return prisma.payoutRequest.findMany({
        where: { organizerId: organizer.id },
        orderBy: { createdAt: "desc" },
    });
}

// ── Admin : toutes les demandes ───────────────────────────────────────────────

export async function getAllPayoutRequests() {
    await requireAdmin();
    return prisma.payoutRequest.findMany({
        include: { organizer: { select: { name: true, email: true } } },
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    });
}

export async function processPayoutRequest(
    id: string,
    status: Extract<PayoutStatus, "PAID" | "REJECTED" | "PROCESSING">,
    adminNote?: string,
) {
    await requireAdmin();

    const request = await prisma.payoutRequest.update({
        where: { id },
        data: {
            status,
            adminNote: adminNote ?? null,
            processedAt: status === "PAID" ? new Date() : null,
        },
        include: { organizer: { select: { email: true, name: true } } },
    });

    // Notifier l'organisateur du changement de statut
    const typeMap: Record<string, "PROCESSING" | "PAID" | "REJECTED"> = {
        PROCESSING: "PROCESSING",
        PAID: "PAID",
        REJECTED: "REJECTED",
    };

    await sendPayoutStatusEmail({
        to: request.organizer.email,
        organizerName: request.organizer.name ?? request.organizer.email,
        type: typeMap[status],
        netAmount: request.netAmount,
        grossAmount: request.grossAmount,
        commissionRate: request.commissionRate,
        adminNote,
    });

    revalidatePath("/admin/payouts");
}
