"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { IconMail, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { resendOrderTickets } from "@/actions/payment.actions";

/**
 * Renvoie les billets par email.
 *
 * Utile quand l'envoi initial a échoué (Resend indisponible, adresse en
 * quarantaine) ou quand l'acheteur a simplement supprimé le message.
 */
export function ResendTicketsButton({ orderId }: { orderId: string }) {
    const [isPending, startTransition] = useTransition();

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() =>
                startTransition(async () => {
                    const res = await resendOrderTickets(orderId);
                    if (res.error) toast.error(res.error);
                    else toast.success("Billets renvoyés par email.");
                })
            }
        >
            {isPending ? (
                <IconLoader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
                <IconMail className="w-4 h-4" aria-hidden="true" />
            )}
            Renvoyer par email
        </Button>
    );
}
