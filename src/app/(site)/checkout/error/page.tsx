import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    IconCircleX,
    IconRefresh,
    IconWallet,
    IconDeviceMobile,
    IconPhone,
} from "@tabler/icons-react";

export const metadata: Metadata = {
    title: "Paiement échoué",
    robots: { index: false, follow: false },
};

interface Props {
    searchParams: Promise<{
        /** Slug de l'évènement, pour proposer une reprise. */
        event?: string;
        /** Panier encodé, repris tel quel depuis le tunnel. */
        panier?: string;
        /** Message renvoyé par l'opérateur, le cas échéant. */
        raison?: string;
    }>;
}

/** Causes usuelles d'un refus Mobile Money, dans l'ordre de fréquence. */
const CAUSES = [
    {
        icon: IconWallet,
        label: "Solde insuffisant sur le compte Mobile Money.",
    },
    {
        icon: IconDeviceMobile,
        label: "Demande expirée ou refusée sur le téléphone.",
    },
    {
        icon: IconPhone,
        label: "Numéro ne correspondant pas à l'opérateur sélectionné.",
    },
];

export default async function CheckoutErrorPage({ searchParams }: Props) {
    const { event, panier, raison } = await searchParams;

    // Reprise possible seulement si l'on sait quoi reproposer.
    const retryHref =
        event && panier
            ? `/checkout/${event}?panier=${encodeURIComponent(panier)}`
            : event
              ? `/events/${event}`
              : null;

    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
            <div className="w-full max-w-md space-y-6">
                <div className="space-y-4 rounded-3xl border bg-card p-8 text-center shadow-xl">
                    <IconCircleX
                        className="mx-auto h-16 w-16 text-destructive"
                        aria-hidden="true"
                    />

                    <div className="space-y-2">
                        <h1 className="font-afo text-3xl">Paiement échoué</h1>
                        <p className="text-sm text-muted-foreground">
                            {raison
                                ? raison
                                : "Votre paiement n'a pas pu être confirmé. Aucun montant n'a été prélevé."}
                        </p>
                    </div>

                    <p className="rounded-xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                        Vos billets n&apos;ont pas été réservés. Vous pouvez
                        réessayer immédiatement.
                    </p>
                </div>

                {/* Causes fréquentes — évite un aller-retour avec le support */}
                <div className="rounded-2xl border bg-card p-5">
                    <p className="mb-3 text-sm font-semibold">
                        Causes les plus fréquentes
                    </p>
                    <ul className="space-y-2.5">
                        {CAUSES.map(({ icon: Icon, label }) => (
                            <li
                                key={label}
                                className="flex items-start gap-2.5 text-sm text-muted-foreground"
                            >
                                <Icon
                                    className="mt-0.5 h-4 w-4 shrink-0 text-secondary"
                                    aria-hidden="true"
                                />
                                {label}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex flex-col gap-3">
                    {retryHref && (
                        <Button asChild size="lg">
                            <Link href={retryHref}>
                                <IconRefresh
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                Réessayer le paiement
                            </Link>
                        </Button>
                    )}
                    <Button asChild variant="outline">
                        <Link href="/events">
                            Voir d&apos;autres évènements
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/contact">Contacter le support</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
