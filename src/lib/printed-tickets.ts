/**
 * Billets physiques : billets imprimés en lot, vendus en point de vente.
 *
 * Un lot est une commande `PRINTED` dont chaque ligne est un billet unique
 * (quantité 1) portant un numéro de série. Le même QR sert à l'activation
 * (point de vente, au moment de la vente) et au contrôle d'entrée : un billet
 * imprimé non activé est refusé à l'entrée.
 */

/** Commission Benin Events sur les billets imprimés activés (vendus). */
export const PHYSICAL_COMMISSION_RATE = 0.03;

/** Taille maximale d'un lot (50 feuilles A4 de 8 billets). */
export const MAX_PRINT_BATCH = 400;

/** Billets par feuille A4 paysage (2 colonnes × 4 rangées). */
export const TICKETS_PER_SHEET = 8;

const GENERIC_WORDS = new Set(["PASS", "BILLET", "TICKET", "ENTREE", "ACCES"]);

/**
 * Préfixe du numéro imprimé, tiré du titre du billet : « Pass VVIP » → VVIP,
 * « Standard 1 jour » → STANDA. Les mots génériques sont ignorés.
 */
export function ticketCodePrefix(title: string): string {
    const words = title
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toUpperCase()
        .split(/[^A-Z0-9]+/)
        .filter(Boolean);
    const word = words.find((w) => !GENERIC_WORDS.has(w)) ?? words[0] ?? "BILLET";
    return word.slice(0, 6);
}

/** Numéro imprimé sur le billet, ex. VVIP-0001. */
export function printedTicketCode(title: string, serial: number | null): string {
    return `${ticketCodePrefix(title)}-${String(serial ?? 0).padStart(4, "0")}`;
}

/** Commission due sur un montant de ventes physiques, arrondie au franc. */
export function physicalCommission(amount: number): number {
    return Math.round(amount * PHYSICAL_COMMISSION_RATE);
}
