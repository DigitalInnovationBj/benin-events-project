/**
 * Habillages d'évènement (`Event.theme`).
 *
 * Un thème change l'apparence de la page publique et du billet PDF d'un
 * évènement, sans toucher au parcours d'achat. Ajouter un thème : créer
 * `src/themes/<clé>/`, puis déclarer la clé ici.
 */
export const EVENT_THEMES = ["adjatche"] as const;

export type EventThemeKey = (typeof EVENT_THEMES)[number];

/** Clé de thème valide, ou null (valeur inconnue = gabarit par défaut). */
export function asEventTheme(value: string | null | undefined): EventThemeKey | null {
    return EVENT_THEMES.includes(value as EventThemeKey) ? (value as EventThemeKey) : null;
}
