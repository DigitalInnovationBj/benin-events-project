"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { IconMail, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
    resendOrderTickets,
    resendOrderTicketsAsOrganizer,
} from "@/actions/payment.actions";

/**
 * Renvoie les billets par email.
 *
 * Utile quand l'envoi initial a échoué (Resend indisponible, adresse en
 * quarantaine) ou quand l'acheteur a simplement supprimé le message.
 */
export function ResendTicketsButton({
    orderId,
    asOrganizer = false,
    label = "Renvoyer par email",
}: {
    orderId: string;
    /** Renvoi déclenché par l'organisateur de l'évènement. */
    asOrganizer?: boolean;
    label?: string;
}) {
    const [isPending, startTransition] = useTransition();

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() =>
                startTransition(async () => {
                    const res = asOrganizer
                        ? await resendOrderTicketsAsOrganizer(orderId)
                        : await resendOrderTickets(orderId);
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
            {label}
        </Button>
    );
}
