import { TIMEZONE } from "@/lib/format";

/**
 * Jours de validité des billets multi-jours.
 *
 * Un jour est représenté par une chaîne « YYYY-MM-DD » calculée dans le fuseau
 * Africa/Porto-Novo : un scan à 00h30 heure locale compte pour le nouveau jour,
 * pas pour la veille UTC.
 */

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

/** Clé « YYYY-MM-DD » d'une date, dans le fuseau du Bénin. */
export function dayKey(date: Date = new Date()): string {
    return dayKeyFormatter.format(date);
}

/** Jours « YYYY-MM-DD » couverts par un évènement (début → fin inclus). */
export function eventDayKeys(startDate: Date, endDate: Date): string[] {
    const keys: string[] = [];
    const last = dayKey(endDate);
    // On avance de 24 h en 24 h depuis le début ; la limite protège d'un
    // évènement mal saisi (fin très lointaine).
    for (let i = 0; i < 60; i++) {
        const key = dayKey(new Date(startDate.getTime() + i * 86_400_000));
        if (keys[keys.length - 1] !== key) keys.push(key);
        if (key >= last) break;
    }
    return keys;
}

/** « 2026-12-18 » → « 18 déc. » */
export function formatDayKey(key: string): string {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
    });
}

/** Valide et normalise une liste de jours reçue d'un formulaire. */
export function parseDayKeys(values: string[]): string[] | null {
    const clean = [...new Set(values.map((v) => v.trim()).filter(Boolean))];
    if (!clean.every((v) => /^\d{4}-\d{2}-\d{2}$/.test(v))) return null;
    return clean.sort();
}

/** Titre de billet complété des jours de validité d'un pass multi-jours. */
export function ticketTitleWithDays(title: string, validDays: string[]): string {
    if (validDays.length === 0) return title;
    return `${title} (valable ${validDays.map(formatDayKey).join(", ")})`;
}
