"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconLoader2 } from "@tabler/icons-react";
import { usePaymentPolling } from "@/hooks/use-payment-polling";
import { getOrderPaymentStatus } from "@/actions/payment.actions";

/**
 * Surveille une commande encore en attente sur la page de confirmation.
 *
 * Sans ça, l'acheteur voyait un message figé « paiement en cours de
 * traitement » et devait recharger la page à l'aveugle pour savoir où il en
 * était.
 */
export function PendingOrderWatcher({ orderId }: { orderId: string }) {
    const router = useRouter();

    const polling = usePaymentPolling(getOrderPaymentStatus, {
        // Le serveur revérifie déjà auprès de FeexPay à chaque appel : on
        // rafraîchit la page pour afficher le récapitulatif complet.
        onSettled: () => router.refresh(),
    });

    const { start } = polling;

    useEffect(() => {
        start(orderId);
    }, [start, orderId]);

    if (polling.timedOut) {
        return (
            <p className="text-xs text-muted-foreground" role="status">
                La confirmation prend plus de temps que prévu. Vous recevrez un
                email dès que le paiement sera validé.
            </p>
        );
    }

    return (
        <p
            className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
            role="status"
            aria-live="polite"
        >
            <IconLoader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Vérification du paiement en cours…
        </p>
    );
}
