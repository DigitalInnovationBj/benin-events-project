"use server";

import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function syncUser() {
    const user = await currentUser();

    if (!user) {
        return { success: false, message: "Non authentifié" };
    }

    const email = user.emailAddresses[0].emailAddress;

    try {
        let dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } });

        if (!dbUser) {
            dbUser = await prisma.user.create({
                data: {
                    clerkId: user.id,
                    email,
                    name:
                        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                        email.split("@")[0],
                    image: user.imageUrl,
                    role: "USER",
                },
            });
        }

        // Lier les commandes passées en tant qu'invité avec cet email
        const linked = await prisma.order.updateMany({
            where: { guestEmail: email, userId: null },
            data: { userId: dbUser.id, guestEmail: null, guestName: null },
        });

        if (linked.count > 0) {
            console.log(`syncUser: ${linked.count} commande(s) invité liée(s) à ${dbUser.id}`);
        }

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la synchronisation utilisateur :", error);
        return { success: false, message: "Erreur serveur" };
    }
}
