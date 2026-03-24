import { currentUser } from "@clerk/nextjs/server";
import prisma from "./prisma";
import { Role } from "@prisma/client";

/**
 * Récupère le rôle de l'utilisateur connecté depuis la base de données.
 */
export async function getUserRole(): Promise<Role | null> {
    const user = await currentUser();
    if (!user) return null;

    const dbUser = await prisma.user.findUnique({
        where: { clerkId: user.id },
        select: { role: true },
    });

    return dbUser?.role || null;
}

/**
 * Vérifie si l'utilisateur connecte a les droits pour créer des évènements.
 */
export async function isOrganizer() {
    const role = await getUserRole();
    return role === "ORGANIZER" || role === "ADMIN";
}

/**
 * Vérifie si l'utilisateur connecte est un Administrateur.
 */
export async function isAdmin() {
    const role = await getUserRole();
    return role === "ADMIN";
}
