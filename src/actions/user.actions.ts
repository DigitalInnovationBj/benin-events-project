"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

/**
 * Active/désactive l'abonnement aux digests newsletter (lundi/mercredi/vendredi).
 */
export async function setNewsletterOptIn(optIn: boolean) {
    const user = await getCurrentUser();
    if (!user) return { error: "Non authentifié" };

    await prisma.user.update({
        where: { id: user.id },
        data: { newsletterOptIn: optIn },
    });

    revalidatePath("/dashboard/profile");
    return { success: true };
}

/**
 * Lit la préférence newsletter de l'utilisateur connecté.
 */
export async function getNewsletterOptIn(): Promise<boolean | null> {
    const user = await getCurrentUser();
    if (!user) return null;

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { newsletterOptIn: true },
    });
    return dbUser?.newsletterOptIn ?? null;
}
