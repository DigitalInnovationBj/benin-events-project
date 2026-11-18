/**
 * Billets physiques : billets imprimés en lot, vendus en point de vente.
 *
 * Un lot est une commande `PRINTED` dont chaque ligne est un billet unique
 * (quantité 1) portant un numéro de série, précédé du code du billet
 * (Ticket.printCode). Le même QR sert à l'activation
 * (point de vente, au moment de la vente) et au contrôle d'entrée : un billet
 * imprimé non activé est refusé à l'entrée.
 */

/** Taille maximale d'un lot (50 feuilles A4 de 8 billets). */
export const MAX_PRINT_BATCH = 400;

/** Billets par feuille A4 paysage (2 colonnes × 4 rangées). */
export const TICKETS_PER_SHEET = 8;

/** Code imprimé : 1 à 8 caractères, lettres, chiffres et tirets internes. */
export const PRINT_CODE_MAX = 8;
const PRINT_CODE_RE = /^[A-Z0-9](?:[A-Z0-9-]{0,6}[A-Z0-9])?$/;

/** Normalise une saisie (majuscules, sans accents ni espaces) ; null si invalide. */
export function normalizePrintCode(input: string): string | null {
    const code = input
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim()
        .replace(/\s+/g, "-");
    return PRINT_CODE_RE.test(code) ? code : null;
}

const GENERIC_WORDS = new Set(["PASS", "BILLET", "TICKET", "ENTREE", "ACCES", "ALL", "ACCESS"]);
const ABBREVIATIONS: Record<string, string> = {
    STANDARD: "STD",
    ECOTOURISME: "ECO",
    PREMIUM: "PREM",
    ETUDIANT: "ETU",
    GRATUIT: "FREE",
};

/**
 * Suggestion de code à partir du titre, à valider par l'organisateur :
 * « Pass Standard 1 jour » → STD-1J, « Pass VVIP — All access » → VVIP.
 */
export function suggestPrintCode(title: string): string {
    const plain = title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
    const words = plain.split(/[^A-Z0-9]+/).filter(Boolean);
    const word = words.find((w) => !GENERIC_WORDS.has(w) && !/^\d+$/.test(w)) ?? "BILLET";
    const days = plain.match(/(\d+)\s*JOURS?/)?.[1];
    const suffix = days ? `-${days}J` : "";
    const base = (ABBREVIATIONS[word] ?? word).slice(0, PRINT_CODE_MAX - suffix.length);
    return base + suffix;
}

/** Code d'un billet : celui choisi, sinon la suggestion tirée du titre. */
export function ticketPrintCode(ticket: { printCode: string | null; title: string }): string {
    return ticket.printCode ?? suggestPrintCode(ticket.title);
}

/** Numéro imprimé sur le billet, ex. STD-1J-0001. */
export function printedTicketCode(code: string, serial: number | null): string {
    return `${code}-${String(serial ?? 0).padStart(4, "0")}`;
}

/**
 * Commission due sur les ventes physiques. `ratePercent` vient des
 * paramètres de la plateforme (PlatformSettings.physicalCommissionRate),
 * arrondie au franc supérieur comme la commission des reversements.
 */
export function physicalCommission(amount: number, ratePercent: number): number {
    return Math.ceil((amount * ratePercent) / 100);
}
