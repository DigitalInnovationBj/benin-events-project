/**
 * Frais du paiement par carte (GeniusPay), ajoutés au prix payé par
 * l'acheteur. GeniusPay prélève sur le montant débité un pourcentage et un
 * montant fixe par transaction ; on majore donc le total pour que le net
 * reçu couvre au moins le prix des billets :
 *
 *   débité = total + frais
 *   net    = débité × (1 − taux) − fixe ≥ total
 *
 * Les frais sont arrondis à la dizaine supérieure (2 000 F → 170 F de frais).
 *
 * Fonction pure (sans variable d'environnement) : partagée entre le serveur
 * et l'écran de paiement, qui reçoit la grille en propriété.
 */
export type CardFeeConfig = {
    /** Pourcentage prélevé par GeniusPay (ex. 3). */
    percent: number;
    /** Montant fixe par transaction, en FCFA (ex. 100). */
    fixed: number;
};

export function cardFeeFor(total: number, config: CardFeeConfig): number {
    if (total <= 0) return 0;
    const rate = Math.min(Math.max(config.percent, 0), 49) / 100;
    const fixed = Math.max(config.fixed, 0);
    const gross = (total + fixed) / (1 - rate);
    const fee = gross - total;
    return Math.ceil(fee / 10) * 10;
}

/** Montant minimal accepté par GeniusPay, en FCFA. */
export const CARD_MIN_AMOUNT = 200;
