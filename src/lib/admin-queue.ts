import prisma from "@/lib/prisma";

/** Éléments en attente de validation par l'administrateur. */
export type AdminQueue = {
    organizerRequests: number;
    partnerRequests: number;
    payouts: number;
    payoutsAmount: number;
};

export async function getAdminQueue(): Promise<AdminQueue> {
    const [organizerRequests, partnerRequests, payouts] = await Promise.all([
        prisma.organizerRequest.count({ where: { status: "PENDING" } }),
        prisma.partnerRequest.count({ where: { status: "PENDING" } }),
        prisma.payoutRequest.aggregate({
            where: { status: { in: ["PENDING", "PROCESSING"] } },
            _count: true,
            _sum: { netAmount: true },
        }),
    ]);
    return {
        organizerRequests,
        partnerRequests,
        payouts: payouts._count,
        payoutsAmount: payouts._sum.netAmount ?? 0,
    };
}
