import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { getRemainingStock } from "@/lib/stock";
import { decodeCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { IconShoppingBag } from "@tabler/icons-react";

export const metadata: Metadata = {
    title: "Finaliser ma commande",
    robots: { index: false, follow: false },
};

interface Props {
    params: Promise<{ eventSlug: string }>;
    searchParams: Promise<{ panier?: string }>;
}

/**
 * Tunnel d'achat.
 *
 * Remplace le dialog de 493 lignes ancré sur la page évènement, qui limitait
 * une commande à une seule catégorie de billet. Le panier est lu depuis
 * l'URL (`?panier=id:qty,...`) et entièrement revalidé ici : billets
 * existants, même évènement, évènement en vente, stock disponible.
 */
export default async function CheckoutPage({ params, searchParams }: Props) {
    const { eventSlug } = await params;
    const { panier } = await searchParams;

    const event = await prisma.event.findUnique({
        where: { slug: eventSlug },
        select: {
            id: true,
            slug: true,
            title: true,
            startDate: true,
            location: true,
            eventType: true,
            imageUrl: true,
            isDeleted: true,
            isPublished: true,
            isCancelled: true,
            endDate: true,
            tickets: {
                where: { isArchived: false },
                select: {
                    id: true,
                    title: true,
                    price: true,
                    totalStock: true,
                },
            },
        },
    });

    if (!event || event.isDeleted || !event.isPublished) notFound();

    const entries = decodeCart(panier);

    // ── Panier vide ou évènement non achetable ────────────────────────────
    const now = new Date();
    const unavailableReason = event.isCancelled
        ? "Cet évènement a été annulé."
        : event.endDate < now
          ? "Cet évènement est terminé."
          : null;

    if (unavailableReason || entries.length === 0) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
                <div className="max-w-md w-full text-center space-y-6">
                    <IconShoppingBag
                        className="w-16 h-16 mx-auto text-muted-foreground/40"
                        aria-hidden="true"
                    />
                    <div className="space-y-2">
                        <h1 className="text-3xl font-afo">
                            {unavailableReason
                                ? "Commande impossible"
                                : "Votre panier est vide"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {unavailableReason ??
                                "Sélectionnez vos billets sur la page de l'évènement pour continuer."}
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={`/events/${event.slug}`}>
                            Retour à l&apos;évènement
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    // ── Rapprochement panier / billets réels ──────────────────────────────
    const ticketById = new Map(event.tickets.map((t) => [t.id, t]));
    const remaining = await getRemainingStock(
        entries.map((e) => e.ticketId).filter((id) => ticketById.has(id)),
    );

    const lines = entries.flatMap((entry) => {
        const ticket = ticketById.get(entry.ticketId);
        // Billet supprimé ou d'un autre évènement : la ligne est ignorée.
        if (!ticket) return [];

        const left = remaining.get(ticket.id) ?? null;
        const quantity = left === null ? entry.quantity : Math.min(entry.quantity, left);
        if (quantity <= 0) return [];

        return [
            {
                ticketId: ticket.id,
                title: ticket.title,
                price: ticket.price,
                quantity,
                // Signalé à l'utilisateur si sa demande a dû être réduite.
                requested: entry.quantity,
                remainingStock: left,
            },
        ];
    });

    if (lines.length === 0) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
                <div className="max-w-md w-full text-center space-y-6">
                    <IconShoppingBag
                        className="w-16 h-16 mx-auto text-muted-foreground/40"
                        aria-hidden="true"
                    />
                    <div className="space-y-2">
                        <h1 className="text-3xl font-afo">Billets indisponibles</h1>
                        <p className="text-sm text-muted-foreground">
                            Les billets de votre panier ne sont plus en vente.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={`/events/${event.slug}`}>
                            Choisir d&apos;autres billets
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    const user = await getCurrentUser();

    // L'acheteur possède-t-il déjà un billet ? Sert à pré-cocher « pour moi »
    // uniquement quand c'est pertinent.
    const hasExistingTicket = user
        ? (await prisma.orderItem.count({
              where: {
                  attendeeEmail: user.email,
                  order: { eventId: event.id, status: "COMPLETED" },
              },
          })) > 0
        : false;

    return (
        <CheckoutFlow
            event={{
                slug: event.slug,
                title: event.title,
                startDate: event.startDate,
                location: event.location,
                eventType: event.eventType,
                imageUrl: event.imageUrl,
            }}
            eventId={event.id}
            lines={lines}
            buyer={
                user
                    ? { name: user.name ?? "", email: user.email }
                    : null
            }
            hasExistingTicket={hasExistingTicket}
        />
    );
}
