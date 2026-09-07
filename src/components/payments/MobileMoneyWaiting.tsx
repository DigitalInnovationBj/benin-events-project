"use client";

import { IconLoader2, IconDeviceMobile } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

interface MobileMoneyWaitingProps {
    phoneNumber: string;
    timedOut: boolean;
    onRetryCheck: () => void;
    /** La vérification échoue de façon répétée (connexion coupée). */
    connectionIssue?: boolean;
}

export function MobileMoneyWaiting({
    phoneNumber,
    timedOut,
    onRetryCheck,
    connectionIssue = false,
}: MobileMoneyWaitingProps) {
    return (
        // Le passage « en attente » → « toujours en attente » est le seul
        // retour donné à l'utilisateur : il doit être annoncé aux lecteurs
        // d'écran, qui ne verraient sinon aucun changement.
        <div
            className="flex flex-col items-center text-center gap-4 py-6"
            role="status"
            aria-live="polite"
        >
            {timedOut ? (
                <>
                    <IconDeviceMobile
                        className="w-10 h-10 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <div>
                        <p className="font-semibold">Toujours en attente</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Vérifiez votre solde ou réessayez la confirmation sur
                            votre téléphone ({phoneNumber}).
                        </p>
                        {/* La commande n'est pas perdue : le webhook FeexPay et le
                            cron de réconciliation la résoudront de toute façon. */}
                        <p className="text-sm text-muted-foreground mt-2">
                            Votre commande reste valable. Si vous quittez cette
                            page, vous recevrez la confirmation par email dès
                            que le paiement sera validé.
                        </p>
                    </div>
                    <Button variant="outline" onClick={onRetryCheck}>
                        Vérifier maintenant
                    </Button>
                </>
            ) : (
                <>
                    <IconLoader2
                        className="w-10 h-10 text-secondary animate-spin"
                        aria-hidden="true"
                    />
                    <div>
                        <p className="font-semibold">Confirmez sur votre téléphone</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Une demande de paiement a été envoyée au {phoneNumber}.
                            Validez-la pour finaliser.
                        </p>
                        {connectionIssue && (
                            <p className="text-sm text-warning mt-2">
                                Connexion instable — nous continuons à vérifier.
                                Votre paiement n&apos;est pas affecté.
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
