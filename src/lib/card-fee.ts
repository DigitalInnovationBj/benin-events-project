/**
 * Frais du paiement par carte (GeniusPay), ajoutés au prix payé par
 * l'acheteur : GeniusPay prélève un pourcentage du montant débité, on majore
 * donc le total pour que le net reçu égale le prix des billets.
 *
 *   débité = total + frais,  net = débité × (1 − taux) ≥ total
 *
 * Fonction pure (sans variable d'environnement) : partagée entre le serveur
 * et l'écran de paiement, qui reçoit le taux en propriété.
 */
export function cardFeeFor(total: number, feePercent: number): number {
    if (total <= 0 || feePercent <= 0) return 0;
    const rate = feePercent / 100;
    return Math.ceil((total * rate) / (1 - rate));
}

/** Montant minimal accepté par GeniusPay, en FCFA. */
export const CARD_MIN_AMOUNT = 200;
