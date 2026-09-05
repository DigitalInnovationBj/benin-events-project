"use client";

import { useState, useTransition } from "react";
import { processPayoutRequest } from "@/actions/payout.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { IconLoader2, IconChecks, IconX, IconRefresh } from "@tabler/icons-react";

export function PayoutActions({ id, status }: { id: string; status: string }) {
    const [isPending, startTransition] = useTransition();
    const [rejectNote, setRejectNote] = useState("");
    const [showReject, setShowReject] = useState(false);

    function act(action: "PAID" | "PROCESSING" | "REJECTED") {
        startTransition(async () => {
            try {
                await processPayoutRequest(id, action, action === "REJECTED" ? rejectNote : undefined);
                toast.success(
                    action === "PAID" ? "Marqué comme reversé" :
                    action === "PROCESSING" ? "Marqué en cours" :
                    "Demande rejetée"
                );
                setShowReject(false);
            } catch {
                toast.error("Une erreur est survenue");
            }
        });
    }

    if (status === "PAID" || status === "REJECTED") {
        return <span className="text-xs text-muted-foreground">Traité</span>;
    }

    return (
        <div className="flex flex-col gap-2 items-end">
            <div className="flex gap-2">
                {status === "PENDING" && (
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => act("PROCESSING")}
                        className="gap-1.5 text-xs"
                    >
                        {isPending ? <IconLoader2 className="w-3 h-3 animate-spin" /> : <IconRefresh className="w-3 h-3" />}
                        En cours
                    </Button>
                )}
                <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => act("PAID")}
                    className="gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white"
                >
                    {isPending ? <IconLoader2 className="w-3 h-3 animate-spin" /> : <IconChecks className="w-3 h-3" />}
                    Reversé
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => setShowReject((v) => !v)}
                    className="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                    <IconX className="w-3 h-3" />
                    Rejeter
                </Button>
            </div>

            {showReject && (
                <div className="flex gap-2 w-full max-w-xs">
                    <Input
                        placeholder="Motif (optionnel)"
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        className="text-xs h-8"
                    />
                    <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => act("REJECTED")}
                        className="h-8 text-xs bg-destructive hover:bg-destructive/90 text-white shrink-0"
                    >
                        Confirmer
                    </Button>
                </div>
            )}
        </div>
    );
}
