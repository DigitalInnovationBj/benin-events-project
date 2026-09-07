/**
 * Encodage du panier dans l'URL du checkout.
 *
 * Format : `ticketId:quantité` séparés par des virgules — lisible, court, et
 * surtout partageable : l'étape de paiement supporte le rechargement et le
 * retour arrière du navigateur, ce que l'ancien dialog (tout en état local)
 * ne permettait pas.
 *
 * Le contenu vient de l'utilisateur : il est revalidé côté serveur (existence
 * des billets, appartenance au même évènement, stock) avant tout paiement.
 */

/** Plafond de billets par commande, toutes catégories confondues. */
export const MAX_TICKETS_PER_ORDER = 10;

export type CartEntry = { ticketId: string; quantity: number };

export function encodeCart(entries: CartEntry[]): string {
    return entries
        .filter((e) => e.quantity > 0)
        .map((e) => `${e.ticketId}:${e.quantity}`)
        .join(",");
}

/**
 * Analyse le paramètre d'URL. Les entrées mal formées sont ignorées plutôt
 * que de faire échouer la page entière : un lien tronqué doit aboutir à un
 * panier partiel corrigeable, pas à une erreur.
 */
export function decodeCart(raw: string | undefined): CartEntry[] {
    if (!raw) return [];

    const seen = new Set<string>();
    const entries: CartEntry[] = [];

    for (const part of raw.split(",")) {
        const [ticketId, rawQty] = part.split(":");
        if (!ticketId || !rawQty) continue;
        if (seen.has(ticketId)) continue;

        const quantity = Number.parseInt(rawQty, 10);
        if (!Number.isInteger(quantity) || quantity <= 0) continue;

        seen.add(ticketId);
        entries.push({ ticketId, quantity });
    }

    // Plafond global appliqué dans l'ordre des lignes.
    let budget = MAX_TICKETS_PER_ORDER;
    const capped: CartEntry[] = [];
    for (const entry of entries) {
        if (budget <= 0) break;
        const quantity = Math.min(entry.quantity, budget);
        budget -= quantity;
        capped.push({ ...entry, quantity });
    }

    return capped;
}
