"use client";

import { useSyncExternalStore } from "react";

/**
 * Indique si l'utilisateur a demandé à réduire les animations.
 *
 * Le CSS neutralise déjà transitions et animations (cf. globals.css), mais un
 * carrousel en autoplay change le *contenu* affiché : cela relève du
 * comportement JS, pas de la feuille de style. D'où ce hook.
 *
 * `useSyncExternalStore` est le bon outil ici : `matchMedia` est un store
 * externe, et le rendu serveur reçoit `false` via `getServerSnapshot`.
 */

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
    const query = window.matchMedia(QUERY);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
    return window.matchMedia(QUERY).matches;
}

/** Le serveur ne connaît pas la préférence : on n'anime pas moins par défaut. */
function getServerSnapshot(): boolean {
    return false;
}

export function useReducedMotion(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
