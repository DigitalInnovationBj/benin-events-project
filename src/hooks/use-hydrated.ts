"use client";

import { useSyncExternalStore } from "react";

/** Aucun changement à notifier : la valeur passe de false à true une seule fois,
 *  au moment de l'hydratation. */
function subscribe(): () => void {
    return () => {};
}

/**
 * Vaut `false` pendant le rendu serveur et le premier rendu client, puis `true`.
 *
 * Sert aux composants dont l'affichage dépend d'un état connu du navigateur
 * seul (thème persisté dans localStorage, par exemple) : ils rendent un
 * substitut neutre tant que ce hook renvoie `false`, ce qui évite une erreur
 * d'hydratation.
 */
export function useHydrated(): boolean {
    return useSyncExternalStore(
        subscribe,
        () => true,
        () => false,
    );
}
