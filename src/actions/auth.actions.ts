"use server";

import { ensureDbUser } from "@/lib/sync-user";

export async function syncUser() {
    try {
        const dbUser = await ensureDbUser();

        if (!dbUser) {
            return { success: false, message: "Non authentifié" };
        }

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la synchronisation utilisateur :", error);
        return { success: false, message: "Erreur serveur" };
    }
}
