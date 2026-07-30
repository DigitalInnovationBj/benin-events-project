import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";

export interface SessionUser {
    id: string;
    email: string;
    name: string;
    image: string | null;
    role: Role;
}

/**
 * Utilisateur connecté (depuis la session better-auth), ou null.
 * Remplace l'ancien pattern deux-temps Clerk (auth() + findUnique clerkId) :
 * better-auth stocke les users dans notre table User, la session suffit.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return null;

    const u = session.user;
    return {
        id: u.id,
        email: u.email,
        name: u.name,
        image: u.image ?? null,
        role: (u.role ?? "USER") as Role,
    };
}

/**
 * Récupère le rôle de l'utilisateur connecté.
 */
export async function getUserRole(): Promise<Role | null> {
    const user = await getCurrentUser();
    return user?.role ?? null;
}

/**
 * Vérifie si l'utilisateur connecté a les droits pour créer des évènements.
 */
export async function isOrganizer() {
    const role = await getUserRole();
    return role === "ORGANIZER" || role === "ADMIN";
}

/**
 * Vérifie si l'utilisateur connecté est un Administrateur.
 */
export async function isAdmin() {
    const role = await getUserRole();
    return role === "ADMIN";
}

/**
 * Garde pour les server actions : lève si non connecté.
 */
export async function requireUser(): Promise<SessionUser> {
    const user = await getCurrentUser();
    if (!user) throw new Error("Non authentifié");
    return user;
}

/**
 * Garde pour les server actions : lève si ni organisateur ni admin.
 */
export async function requireOrganizer(): Promise<SessionUser> {
    const user = await requireUser();
    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
        throw new Error("Accès refusé");
    }
    return user;
}

/**
 * Garde pour les server actions : lève si non admin.
 */
export async function requireAdmin(): Promise<SessionUser> {
    const user = await requireUser();
    if (user.role !== "ADMIN") throw new Error("Accès refusé");
    return user;
}
