"use client";

import { Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileMoneyWaitingProps {
    phoneNumber: string;
    timedOut: boolean;
    onRetryCheck: () => void;
}

export function MobileMoneyWaiting({
    phoneNumber,
    timedOut,
    onRetryCheck,
}: MobileMoneyWaitingProps) {
    return (
        <div className="flex flex-col items-center text-center gap-4 py-6">
            {timedOut ? (
                <>
                    <Smartphone className="w-10 h-10 text-muted-foreground" />
                    <div>
                        <p className="font-semibold">Toujours en attente</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Vérifiez votre solde ou réessayez la confirmation sur
                            votre téléphone ({phoneNumber}).
                        </p>
                    </div>
                    <Button variant="outline" onClick={onRetryCheck}>
                        Vérifier maintenant
                    </Button>
                </>
            ) : (
                <>
                    <Loader2 className="w-10 h-10 text-secondary animate-spin" />
                    <div>
                        <p className="font-semibold">Confirmez sur votre téléphone</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Une demande de paiement a été envoyée au {phoneNumber}.
                            Validez-la pour finaliser.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
