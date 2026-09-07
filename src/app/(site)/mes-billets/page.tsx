import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatXOF, formatEventDateLong } from "@/lib/format";
import { reconcilePendingOrdersOfUser } from "@/lib/payment-reconciliation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, orderStatusBadge } from "@/components/ui/status-badge";
import { IconTicket, IconCalendar, IconGift, IconUser } from "@tabler/icons-react";
import { TicketQrCode } from "@/components/orders/ticket-qr-code";
import { ResendTicketsButton } from "@/components/orders/resend-tickets-button";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
    title: "Mes billets",
    robots: { index: false, follow: false },
};

export default async function MesBilletsPage() {
    const dbUser = await getCurrentUser();
    if (!dbUser) redirect("/sign-in?redirect_url=%2Fmes-billets");

    // Lier les éventuelles commandes invitées passées sous cet email
    await prisma.order.updateMany({
        where: { guestEmail: dbUser.email, userId: null },
        data: { userId: dbUser.id, guestEmail: null, guestName: null },
    });

    // Résout les paiements restés en attente (onglet fermé pendant l'attente
    // Mobile Money) sans dépendre du cron quotidien. Après le rattachement
    // ci-dessus, les commandes invité de cet email sont couvertes aussi.
    await reconcilePendingOrdersOfUser(dbUser.id);

    // Commandes dont l'utilisateur est l'acheteur
    const buyerOrders = await prisma.order.findMany({
        where: { userId: dbUser.id },
        include: {
            event: { select: { title: true, slug: true, startDate: true } },
            items: { include: { ticket: { select: { title: true } } } },
        },
        orderBy: { createdAt: "desc" },
    });

    // Billets reçus : l'utilisateur est nommé comme bénéficiaire sur un item
    // mais n'est pas l'acheteur de la commande parente
    const receivedItems = await prisma.orderItem.findMany({
        where: {
            attendeeEmail: dbUser.email,
            order: { userId: { not: dbUser.id } },
        },
        include: {
            ticket: { select: { title: true } },
            order: {
                include: {
                    event: { select: { title: true, slug: true, startDate: true } },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const hasContent = buyerOrders.length > 0 || receivedItems.length > 0;

    return (
        <div className="max-w-3xl mx-auto w-full px-4 py-10 pb-20">
            <h1 className="text-4xl font-afo mb-2">Mes billets</h1>
            <p className="text-muted-foreground text-sm mb-8">
                Vos commandes et les billets qui vous ont été offerts.
            </p>

            {!hasContent ? (
                <div className="text-center py-20 border border-dashed rounded-2xl">
                    <IconTicket className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                        Aucun billet pour le moment.
                    </p>
                    <Button asChild variant="secondary">
                        <Link href="/events">Parcourir les évènements</Link>
                    </Button>
                </div>
            ) : (
                <div className="space-y-10">

                    {/* ── Commandes achetées ──────────────────────── */}
                    {buyerOrders.length > 0 && (
                        <section className="space-y-4">
                            {buyerOrders.map(order => {
                                const { tone, label, icon } = orderStatusBadge(order.status);

                                return (
                                    <div
                                        key={order.id}
                                        className="bg-card border rounded-2xl p-4 sm:p-5 space-y-4"
                                    >
                                        {/* En-tête */}
                                        <div className="flex items-start justify-between gap-4 flex-wrap">
                                            <div className="min-w-0">
                                                <Link
                                                    href={`/events/${order.event.slug}`}
                                                    className="font-bold text-base sm:text-lg hover:underline underline-offset-2 line-clamp-1"
                                                >
                                                    {order.event.title}
                                                </Link>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                                    <IconCalendar className="w-3.5 h-3.5 shrink-0" />
                                                    {formatEventDateLong(order.event.startDate)}
                                                </div>
                                            </div>
                                            <StatusBadge tone={tone} label={label} icon={icon} className="shrink-0" />
                                        </div>

                                        {/* Lignes de billets */}
                                        <div className="space-y-1.5">
                                            {order.items.map(item => {
                                                const isMyTicket = item.attendeeEmail === dbUser.email || !item.attendeeEmail;
                                                return (
                                                    <div key={item.id} className="flex justify-between text-sm gap-2">
                                                        <span className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                                                            <IconTicket className="w-3.5 h-3.5 shrink-0" />
                                                            <span className="truncate">{item.ticket.title}</span>
                                                            {isMyTicket ? (
                                                                <span className="shrink-0 text-xs bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-md font-medium">
                                                                    Vous
                                                                </span>
                                                            ) : (
                                                                <span className="shrink-0 text-xs flex items-center gap-1 text-muted-foreground/70 italic">
                                                                    <IconUser className="w-3 h-3" />
                                                                    {item.attendeeName ?? "Bénéficiaire"}
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span className="font-medium shrink-0">
                                                            {formatXOF(item.price * item.quantity)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* QR codes — commandes confirmées */}
                                        {order.status === "COMPLETED" && (
                                            <div className="space-y-2 pt-1">
                                                {order.items.map(item => (
                                                    <TicketQrCode
                                                        key={item.id}
                                                        verifyUrl={`${APP_URL}/verify?item=${item.id}&order=${order.reference}`}
                                                        ticketTitle={
                                                            item.attendeeName && item.attendeeEmail !== dbUser.email
                                                                ? `${item.ticket.title} — ${item.attendeeName}`
                                                                : item.ticket.title
                                                        }
                                                        quantity={item.quantity}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Livraison des billets */}
                                        {order.status === "COMPLETED" && (
                                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
                                                <p className="text-xs text-muted-foreground">
                                                    {order.ticketsSentAt
                                                        ? "Billets envoyés par email."
                                                        : "Envoi des billets en attente ou échoué."}
                                                </p>
                                                <ResendTicketsButton orderId={order.id} />
                                            </div>
                                        )}

                                        {/* Pied */}
                                        <div className="border-t pt-3 flex items-center justify-between gap-4">
                                            <span className="text-xs text-muted-foreground font-mono truncate">
                                                {order.reference}
                                            </span>
                                            <span className="font-bold text-secondary shrink-0">
                                                {formatXOF(order.totalAmount)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </section>
                    )}

                    {/* ── Billets reçus (bénéficiaire nommé) ─────── */}
                    {receivedItems.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-2">
                                <IconGift className="w-5 h-5 text-secondary" />
                                <h2 className="text-xl font-afo">Billets reçus</h2>
                            </div>
                            <p className="text-sm text-muted-foreground -mt-2">
                                Ces billets ont été achetés pour vous par quelqu&apos;un d&apos;autre.
                            </p>

                            {receivedItems.map(item => {
                                const { tone, label, icon } = orderStatusBadge(item.order.status);

                                return (
                                    <div
                                        key={item.id}
                                        className="bg-card border border-secondary/20 rounded-2xl p-4 sm:p-5 space-y-4"
                                    >
                                        <div className="flex items-start justify-between gap-4 flex-wrap">
                                            <div className="min-w-0">
                                                <Link
                                                    href={`/events/${item.order.event.slug}`}
                                                    className="font-bold text-base sm:text-lg hover:underline underline-offset-2 line-clamp-1"
                                                >
                                                    {item.order.event.title}
                                                </Link>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                                    <IconCalendar className="w-3.5 h-3.5 shrink-0" />
                                                    {formatEventDateLong(item.order.event.startDate)}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Badge variant="outline" className="text-secondary border-secondary/30 text-xs">
                                                    Reçu
                                                </Badge>
                                                <StatusBadge tone={tone} label={label} icon={icon} />
                                            </div>
                                        </div>

                                        <div className="flex justify-between text-sm gap-2">
                                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                                <IconTicket className="w-3.5 h-3.5 shrink-0" />
                                                {item.ticket.title}
                                            </span>
                                            <span className="font-medium shrink-0">
                                                {formatXOF(item.price * item.quantity)}
                                            </span>
                                        </div>

                                        {item.order.status === "COMPLETED" && (
                                            <TicketQrCode
                                                verifyUrl={`${APP_URL}/verify?item=${item.id}&order=${item.order.reference}`}
                                                ticketTitle={item.ticket.title}
                                                quantity={item.quantity}
                                            />
                                        )}

                                        <div className="border-t pt-3">
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {item.order.reference}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </section>
                    )}

                </div>
            )}
        </div>
    );
}
