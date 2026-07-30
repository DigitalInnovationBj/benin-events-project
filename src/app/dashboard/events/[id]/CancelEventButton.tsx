"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cancelEvent } from "@/actions/event.actions";
import { toast } from "sonner";

interface Props {
    eventId: string;
    eventTitle: string;
}

export default function CancelEventButton({ eventId, eventTitle }: Props) {
    const [open, setOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [reason, setReason] = useState("");
    const router = useRouter();

    const handleCancel = async () => {
        setIsCancelling(true);

        const result = await cancelEvent(eventId, reason);

        if (result?.error) {
            toast.error(result.error);
            setIsCancelling(false);
        } else {
            toast.success(
                result?.ordersToRefund
                    ? `Évènement annulé. ${result.ordersToRefund} commande(s) à rembourser.`
                    : "Évènement annulé.",
            );
            setOpen(false);
            setIsCancelling(false);
            router.refresh();
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
                    <Ban className="w-4 h-4" />
                    Annuler
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Annuler cet évènement ?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        L&apos;évènement{" "}
                        <span className="font-semibold text-foreground">
                            &ldquo;{eventTitle}&rdquo;
                        </span>{" "}
                        sera dépublié et tous les acheteurs de billets payés
                        seront notifiés par email qu&apos;un remboursement est
                        en cours. Le remboursement effectif se fait ensuite
                        depuis l&apos;onglet Remboursements.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-2">
                    <Label htmlFor="cancel-reason">Motif (optionnel, envoyé aux acheteurs)</Label>
                    <Textarea
                        id="cancel-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Ex : indisponibilité du lieu, force majeure…"
                        disabled={isCancelling}
                    />
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isCancelling}>
                        Retour
                    </AlertDialogCancel>
                    <Button
                        onClick={handleCancel}
                        disabled={isCancelling}
                        variant="destructive"
                        className="gap-2"
                    >
                        {isCancelling && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        {isCancelling ? "Annulation…" : "Oui, annuler l'évènement"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
