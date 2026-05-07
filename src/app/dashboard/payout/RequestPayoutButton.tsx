"use client";

import { useTransition } from "react";
import { requestPayout } from "@/actions/payout.actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, SendHorizonal } from "lucide-react";

export function RequestPayoutButton({
    disabled,
    netAmount,
}: {
    disabled: boolean;
    netAmount: number;
}) {
    const [isPending, startTransition] = useTransition();

    function handleClick() {
        startTransition(async () => {
            try {
                await requestPayout();
                toast.success("Demande de reversement envoyée !");
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
            }
        });
    }

    return (
        <Button
            onClick={handleClick}
            disabled={disabled || isPending || netAmount <= 0}
            className="gap-2"
        >
            {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <SendHorizonal className="w-4 h-4" />
            )}
            {isPending ? "Envoi…" : `Demander ${netAmount.toLocaleString("fr-FR")} FCFA`}
        </Button>
    );
}
