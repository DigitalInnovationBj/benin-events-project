"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    IconTicket,
    IconMinus,
    IconPlus,
    IconArrowRight,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { formatXOF } from "@/lib/format";
import { encodeCart, MAX_TICKETS_PER_ORDER } from "@/lib/cart";
import { cn } from "@/lib/utils";

export type SelectableTicket = {
    id: string;
    title: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    remainingStock: number | null;
};

interface Props {
    eventSlug: string;
    tickets: SelectableTicket[];
    isCancelled: boolean;
}

/**
 * Sélection des billets sur la page évènement.
 *
 * Remplace les N boutons « Acheter » (un dialog par catégorie), qui rendaient
 * impossible l'achat de deux catégories en une commande : il fallait payer
 * deux fois, avec deux push mobile money.
 *
 * Le panier est encodé dans l'URL du checkout, ce qui rend l'étape suivante
 * partageable et compatible avec le retour arrière du navigateur.
 */
export function TicketSelector({ eventSlug, tickets, isCancelled }: Props) {
    const router = useRouter();
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    const { totalQuantity, totalAmount } = useMemo(() => {
        let qty = 0;
        let amount = 0;
        for (const ticket of tickets) {
            const n = quantities[ticket.id] ?? 0;
            qty += n;
            amount += n * ticket.price;
        }
        return { totalQuantity: qty, totalAmount: amount };
    }, [quantities, tickets]);

    const remainingAllowance = MAX_TICKETS_PER_ORDER - totalQuantity;

    function setQuantity(ticketId: string, next: number) {
        setQuantities((prev) => {
            const copy = { ...prev };
            if (next <= 0) delete copy[ticketId];
            else copy[ticketId] = next;
            return copy;
        });
    }

    function goToCheckout() {
        const cart = tickets
            .filter((t) => (quantities[t.id] ?? 0) > 0)
            .map((t) => ({ ticketId: t.id, quantity: quantities[t.id] }));
        if (cart.length === 0) return;
        router.push(`/checkout/${eventSlug}?panier=${encodeCart(cart)}`);
    }

    if (tickets.length === 0) {
        return (
            <p className="text-muted-foreground text-center py-6 bg-muted/30 rounded-xl border border-dashed text-sm">
                Aucun billet en vente pour le moment.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {tickets.map((ticket) => {
                const quantity = quantities[ticket.id] ?? 0;
                const soldOut =
                    ticket.remainingStock !== null && ticket.remainingStock <= 0;
                // Bornée par le stock de la ligne ET par le plafond de commande.
                const maxForLine = Math.min(
                    ticket.remainingStock ?? MAX_TICKETS_PER_ORDER,
                    quantity + remainingAllowance,
                );

                return (
                    <div
                        key={ticket.id}
                        className={cn(
                            "border rounded-2xl p-5 transition-colors",
                            quantity > 0
                                ? "border-secondary bg-secondary/5"
                                : "border-secondary/20 hover:border-secondary/50",
                            soldOut && "opacity-60",
                        )}
                    >
                        {ticket.imageUrl && (
                            <div className="relative w-full h-44 mb-4 overflow-hidden rounded-xl bg-muted">
                                <Image
                                    src={ticket.imageUrl}
                                    alt=""
                                    fill
                                    sizes="(min-width: 1024px) 24rem, 100vw"
                                    className="object-cover"
                                />
                            </div>
                        )}

                        <h4 className="font-bold text-lg flex items-center gap-2">
                            <IconTicket
                                className="w-5 h-5 text-secondary shrink-0"
                                aria-hidden="true"
                            />
                            {ticket.title}
                        </h4>

                        {ticket.description && (
                            <p className="text-sm text-muted-foreground mt-1 mb-3 leading-relaxed">
                                {ticket.description}
                            </p>
                        )}

                        <div className="flex items-center justify-between mt-4 gap-3">
                            <span className="font-bold text-xl text-secondary">
                                {formatXOF(ticket.price)}
                            </span>

                            {isCancelled ? (
                                <span className="text-sm text-muted-foreground">
                                    Évènement annulé
                                </span>
                            ) : soldOut ? (
                                <span className="text-sm font-semibold text-muted-foreground">
                                    Complet
                                </span>
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 rounded-lg"
                                        onClick={() =>
                                            setQuantity(ticket.id, quantity - 1)
                                        }
                                        disabled={quantity === 0}
                                        aria-label={`Retirer un billet ${ticket.title}`}
                                    >
                                        <IconMinus
                                            className="w-4 h-4"
                                            aria-hidden="true"
                                        />
                                    </Button>

                                    <span
                                        className="w-9 text-center font-semibold tabular-nums"
                                        aria-live="polite"
                                        aria-label={`${quantity} billet(s) ${ticket.title}`}
                                    >
                                        {quantity}
                                    </span>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 rounded-lg"
                                        onClick={() =>
                                            setQuantity(ticket.id, quantity + 1)
                                        }
                                        disabled={quantity >= maxForLine}
                                        aria-label={`Ajouter un billet ${ticket.title}`}
                                    >
                                        <IconPlus
                                            className="w-4 h-4"
                                            aria-hidden="true"
                                        />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {ticket.remainingStock !== null && !soldOut && (
                            <p className="text-xs text-muted-foreground mt-3 text-right">
                                Places restantes :{" "}
                                <span className="font-semibold text-foreground">
                                    {ticket.remainingStock.toLocaleString("fr-FR")}
                                </span>
                            </p>
                        )}
                    </div>
                );
            })}

            {/* ── Récapitulatif + CTA ──────────────────────────────────── */}
            {!isCancelled && (
                <div className="pt-2">
                    {totalQuantity > 0 ? (
                        <>
                            <div className="flex items-baseline justify-between mb-3">
                                <span className="text-sm text-muted-foreground">
                                    {totalQuantity} billet
                                    {totalQuantity > 1 ? "s" : ""}
                                </span>
                                <span className="text-2xl font-bold text-secondary">
                                    {formatXOF(totalAmount, { zeroLabel: null })}
                                </span>
                            </div>
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={goToCheckout}
                            >
                                Continuer
                                <IconArrowRight
                                    className="w-4 h-4"
                                    aria-hidden="true"
                                />
                            </Button>
                            {remainingAllowance === 0 && (
                                <p className="text-xs text-muted-foreground mt-2 text-center">
                                    Maximum {MAX_TICKETS_PER_ORDER} billets par
                                    commande.
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">
                            Choisissez vos billets pour continuer.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
