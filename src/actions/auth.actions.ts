"use server";

import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function syncUser() {
    const user = await currentUser();

    if (!user) {
        return { success: false, message: "Non authentifié" };
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { clerkId: user.id },
        });

        if (!existingUser) {
            await prisma.user.create({
                data: {
                    clerkId: user.id,
                    email: user.emailAddresses[0].emailAddress,
                    name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.emailAddresses[0].emailAddress.split("@")[0],
                    image: user.imageUrl,
                    role: "USER",
                },
            });
            console.log("Nouvel utilisateur synchronisé :", user.id);
        }

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la synchronisation utilisateur :", error);
        return { success: false, message: "Erreur serveur" };
    }
}
