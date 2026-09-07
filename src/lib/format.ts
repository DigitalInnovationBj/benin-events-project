/**
 * Formatage des montants et des dates.
 *
 * Le projet dupliquait une quarantaine de `price.toLocaleString("fr-FR") + " FCFA"`
 * et autant de `toLocaleDateString("fr-FR", { …, timeZone: "Africa/Porto-Novo" })`,
 * avec des options légèrement différentes d'un écran à l'autre. Tout passe
 * désormais par ces helpers.
 */

/** Fuseau du Bénin (UTC+1, sans heure d'été). */
export const TIMEZONE = "Africa/Porto-Novo";

const LOCALE = "fr-FR";

// `Intl.NumberFormat` en style `currency` rendrait « 5 000 XOF » ; le pays
// utilise « FCFA » à l'écrit. On formate donc le nombre et on suffixe.
const numberFormatter = new Intl.NumberFormat(LOCALE, {
    maximumFractionDigits: 0,
});

/**
 * Montant en francs CFA : `5000` → « 5 000 FCFA », `0` → « Gratuit ».
 *
 * @param options.zeroLabel  libellé pour un montant nul (défaut « Gratuit »).
 *                           Passer `null` pour formater 0 comme un montant.
 */
export function formatXOF(
    amount: number,
    options: { zeroLabel?: string | null } = {},
): string {
    const { zeroLabel = "Gratuit" } = options;
    if (amount === 0 && zeroLabel !== null) return zeroLabel;
    return `${numberFormatter.format(amount)} FCFA`;
}

/** Nombre simple : `1234` → « 1 234 ». */
export function formatNumber(value: number): string {
    return numberFormatter.format(value);
}

// ─────────────────────────────────────────────
// Dates
// ─────────────────────────────────────────────

type DateInput = Date | string | number;

function toDate(value: DateInput): Date {
    return value instanceof Date ? value : new Date(value);
}

/** « lun. 14 sept. » — compact, pour les cartes. */
export function formatEventDateShort(date: DateInput): string {
    return toDate(date).toLocaleDateString(LOCALE, {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: TIMEZONE,
    });
}

/** « lundi 14 septembre 2026 » — pour les pages de détail. */
export function formatEventDateLong(date: DateInput): string {
    return toDate(date).toLocaleDateString(LOCALE, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: TIMEZONE,
    });
}

/** « 20:30 ». */
export function formatEventTime(date: DateInput): string {
    return toDate(date).toLocaleTimeString(LOCALE, {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: TIMEZONE,
    });
}

/** « lundi 14 septembre 2026 à 20:30 » — emails, PDF, confirmations. */
export function formatEventDateTime(date: DateInput): string {
    return `${formatEventDateLong(date)} à ${formatEventTime(date)}`;
}
