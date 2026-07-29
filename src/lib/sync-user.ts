import { currentUser } from "@clerk/nextjs/server";
import prisma from "./prisma";

/**
 * Retourne l'utilisateur en base pour la session Clerk courante, en le
 * créant si nécessaire (upsert → sans doublon même en cas d'appels
 * concurrents), et rattache les commandes passées en invité avec cet email.
 *
 * À utiliser partout où l'on a besoin du User en base pour un utilisateur
 * connecté : ne suppose pas qu'il soit déjà passé par le dashboard.
 */
export async function ensureDbUser() {
    const user = await currentUser();
    if (!user) return null;

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) return null;

    const dbUser = await prisma.user.upsert({
        where: { clerkId: user.id },
        create: {
            clerkId: user.id,
            email,
            name:
                `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                email.split("@")[0],
            image: user.imageUrl,
            role: "USER",
        },
        update: {},
    });

    // Lier les commandes passées en tant qu'invité avec cet email
    const linked = await prisma.order.updateMany({
        where: { guestEmail: email, userId: null },
        data: { userId: dbUser.id, guestEmail: null, guestName: null },
    });

    if (linked.count > 0) {
        console.log(
            `ensureDbUser: ${linked.count} commande(s) invité liée(s) à ${dbUser.id}`,
        );
    }

    return dbUser;
}
