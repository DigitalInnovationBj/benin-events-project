import { getCurrentUser } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Calendar, Gift, User } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { TicketQrCode } from "@/components/orders/ticket-qr-code";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const STATUS_CONFIG: Record<
    OrderStatus,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
    PENDING: { label: "En attente", variant: "secondary" },
    COMPLETED: { label: "Confirmé", variant: "default" },
    FAILED: { label: "Échoué", variant: "destructive" },
    EXPIRED: { label: "Expiré", variant: "outline" },
    CANCELLED: { label: "Annulé", variant: "outline" },
    REFUNDED: { label: "Remboursé", variant: "secondary" },
};

export default async function OrdersPage() {
    const dbUser = await getCurrentUser();
    if (!dbUser) redirect("/sign-in");

    // Lier les éventuelles commandes invitées passées sous cet email
    await prisma.order.updateMany({
        where: { guestEmail: dbUser.email, userId: null },
        data: { userId: dbUser.id, guestEmail: null, guestName: null },
    });

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
        <div className="max-w-3xl mx-auto w-full pb-20">
            <h1 className="text-3xl font-afo mb-8">Mes commandes</h1>

            {!hasContent ? (
                <div className="text-center py-20 border border-dashed rounded-2xl">
                    <Ticket className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                        Aucune commande pour le moment.
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
                                const config = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;

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
                                                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                                                    {new Date(order.event.startDate).toLocaleDateString("fr-FR", {
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                    })}
                                                </div>
                                            </div>
                                            <Badge variant={config.variant} className="shrink-0">
                                                {config.label}
                                            </Badge>
                                        </div>

                                        {/* Lignes de billets */}
                                        <div className="space-y-1.5">
                                            {order.items.map(item => {
                                                const isMyTicket = item.attendeeEmail === dbUser.email || !item.attendeeEmail;
                                                return (
                                                    <div key={item.id} className="flex justify-between text-sm gap-2">
                                                        <span className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                                                            <Ticket className="w-3.5 h-3.5 shrink-0" />
                                                            <span className="truncate">{item.ticket.title}</span>
                                                            {isMyTicket ? (
                                                                <span className="shrink-0 text-xs bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-md font-medium">
                                                                    Vous
                                                                </span>
                                                            ) : (
                                                                <span className="shrink-0 text-xs flex items-center gap-1 text-muted-foreground/70 italic">
                                                                    <User className="w-3 h-3" />
                                                                    {item.attendeeName ?? "Bénéficiaire"}
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span className="font-medium shrink-0">
                                                            {item.price === 0
                                                                ? "Gratuit"
                                                                : `${(item.price * item.quantity).toLocaleString("fr-FR")} F`}
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

                                        {/* Pied */}
                                        <div className="border-t pt-3 flex items-center justify-between gap-4">
                                            <span className="text-xs text-muted-foreground font-mono truncate">
                                                {order.reference}
                                            </span>
                                            <span className="font-bold text-secondary shrink-0">
                                                {order.totalAmount === 0
                                                    ? "Gratuit"
                                                    : `${order.totalAmount.toLocaleString("fr-FR")} FCFA`}
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
                                <Gift className="w-5 h-5 text-secondary" />
                                <h2 className="text-xl font-afo">Billets reçus</h2>
                            </div>
                            <p className="text-sm text-muted-foreground -mt-2">
                                Ces billets ont été achetés pour vous par quelqu&apos;un d&apos;autre.
                            </p>

                            {receivedItems.map(item => {
                                const config = STATUS_CONFIG[item.order.status] ?? STATUS_CONFIG.PENDING;

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
                                                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                                                    {new Date(item.order.event.startDate).toLocaleDateString("fr-FR", {
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                    })}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Badge variant="outline" className="text-secondary border-secondary/30 text-xs">
                                                    Reçu
                                                </Badge>
                                                <Badge variant={config.variant}>{config.label}</Badge>
                                            </div>
                                        </div>

                                        <div className="flex justify-between text-sm gap-2">
                                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                                <Ticket className="w-3.5 h-3.5 shrink-0" />
                                                {item.ticket.title}
                                            </span>
                                            <span className="font-medium shrink-0">
                                                {item.price === 0
                                                    ? "Gratuit"
                                                    : `${(item.price * item.quantity).toLocaleString("fr-FR")} F`}
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
