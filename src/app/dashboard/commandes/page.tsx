import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IconMailOff, IconShoppingBag } from "@tabler/icons-react";
import type { OrderStatus, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { StatusBadge, orderStatusBadge } from "@/components/ui/status-badge";
import { ResendTicketsButton } from "@/components/orders/resend-tickets-button";
import { HelpCallout } from "@/components/dashboard/help-callout";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Commandes" };

const STATUS_FILTERS: { value: OrderStatus | "ALL"; label: string }[] = [
    { value: "ALL", label: "Toutes" },
    { value: "COMPLETED", label: "Payées" },
    { value: "PENDING", label: "En attente" },
    { value: "FAILED", label: "Échouées" },
    { value: "REFUNDED", label: "Remboursées" },
];

const PAGE_SIZE = 30;

function fmtDateTime(d: Date) {
    return d.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Porto-Novo",
    });
}

/**
 * Commandes de tous les évènements de l'organisateur, filtrables par statut,
 * par évènement et par échec de livraison des billets.
 */
export default async function OrganizerOrdersPage({
    searchParams,
}: {
    searchParams: Promise<{
        status?: string;
        event?: string;
        delivery?: string;
        page?: string;
    }>;
}) {
    const user = await getCurrentUser();
    if (!user) redirect("/sign-in");
    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") redirect("/dashboard");

    const sp = await searchParams;
    const status = STATUS_FILTERS.some((f) => f.value === sp.status)
        ? (sp.status as OrderStatus | "ALL")
        : "ALL";
    const deliveryFailed = sp.delivery === "failed";
    const page = Math.max(1, Number(sp.page) || 1);

    const eventScope: Prisma.EventWhereInput =
        user.role === "ADMIN" ? { isDeleted: false } : { organizerId: user.id, isDeleted: false };

    const events = await prisma.event.findMany({
        where: eventScope,
        select: { id: true, title: true },
        orderBy: { startDate: "desc" },
    });
    const eventId = events.some((e) => e.id === sp.event) ? sp.event : undefined;

    const where: Prisma.OrderWhereInput = {
        event: eventScope,
        ...(eventId ? { eventId } : {}),
        // Les lots de billets imprimés ont leur propre onglet (Billets physiques).
        ...(status !== "ALL" ? { status } : { status: { not: "PRINTED" } }),
        ...(deliveryFailed
            ? {
                  status: "COMPLETED",
                  OR: [{ ticketsSendError: { not: null } }, { ticketsSentAt: null }],
              }
            : {}),
    };

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            select: {
                id: true,
                reference: true,
                status: true,
                totalAmount: true,
                createdAt: true,
                guestName: true,
                guestEmail: true,
                ticketsSentAt: true,
                ticketsSendError: true,
                user: { select: { name: true, email: true } },
                event: { select: { id: true, title: true } },
                items: { select: { quantity: true } },
            },
            orderBy: { createdAt: "desc" },
            take: PAGE_SIZE,
            skip: (page - 1) * PAGE_SIZE,
        }),
        prisma.order.count({ where }),
    ]);

    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const hrefWith = (patch: Record<string, string | undefined>) => {
        const params = new URLSearchParams();
        const merged = {
            status: status === "ALL" ? undefined : status,
            event: eventId,
            delivery: deliveryFailed ? "failed" : undefined,
            ...patch,
        };
        for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
        const qs = params.toString();
        return `/dashboard/commandes${qs ? `?${qs}` : ""}`;
    };

    return (
        <div className="mx-auto w-full max-w-6xl space-y-5 pb-10">
            <div>
                <h1 className="font-afo text-2xl sm:text-3xl">Commandes</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    {total} commande{total > 1 ? "s" : ""}
                    {eventId ? " pour cet évènement" : " sur l'ensemble de vos évènements"}
                </p>
            </div>

            <HelpCallout guideAnchor="ventes">
                Une commande « En attente » attend la validation Mobile Money de
                l&apos;acheteur ; elle expire seule après 20 minutes. Si un acheteur
                n&apos;a pas reçu ses billets, renvoyez-les depuis cette page.
            </HelpCallout>

            {/* ── Filtres ───────────────────────────────────────── */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <nav
                    aria-label="Filtrer par statut"
                    className="flex gap-1 overflow-x-auto rounded-full border bg-card p-1"
                >
                    {STATUS_FILTERS.map((f) => {
                        const active = !deliveryFailed && f.value === status;
                        return (
                            <Link
                                key={f.value}
                                href={hrefWith({
                                    status: f.value === "ALL" ? undefined : f.value,
                                    delivery: undefined,
                                    page: undefined,
                                })}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                    "whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                                    active && "bg-secondary font-medium text-secondary-foreground hover:text-secondary-foreground",
                                )}
                            >
                                {f.label}
                            </Link>
                        );
                    })}
                    <Link
                        href={hrefWith({ delivery: "failed", status: undefined, page: undefined })}
                        aria-current={deliveryFailed ? "page" : undefined}
                        className={cn(
                            "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                            deliveryFailed && "bg-secondary font-medium text-secondary-foreground hover:text-secondary-foreground",
                        )}
                    >
                        <IconMailOff className="size-4" aria-hidden="true" />
                        Non délivrées
                    </Link>
                </nav>

                {events.length > 1 && (
                    <form className="flex items-center gap-2" action="/dashboard/commandes">
                        {status !== "ALL" && <input type="hidden" name="status" value={status} />}
                        {deliveryFailed && <input type="hidden" name="delivery" value="failed" />}
                        <label htmlFor="event-filter" className="sr-only">
                            Évènement
                        </label>
                        <select
                            id="event-filter"
                            name="event"
                            defaultValue={eventId ?? ""}
                            className="h-9 max-w-64 rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <option value="">Tous les évènements</option>
                            {events.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.title}
                                </option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            className="h-9 rounded-md border px-3 text-sm hover:bg-accent"
                        >
                            Filtrer
                        </button>
                    </form>
                )}
            </div>

            {/* ── Liste ─────────────────────────────────────────── */}
            {orders.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-card py-14 text-center">
                    <IconShoppingBag className="size-8 text-muted-foreground" aria-hidden="true" />
                    <p className="font-medium">Aucune commande ici</p>
                    <p className="text-sm text-muted-foreground">
                        Modifiez les filtres ou partagez la page de votre évènement.
                    </p>
                </div>
            ) : (
                <ul className="divide-y rounded-2xl border bg-card">
                    {orders.map((o) => {
                        const badge = orderStatusBadge(o.status);
                        const buyer = o.user?.name ?? o.guestName ?? "Client";
                        const email = o.user?.email ?? o.guestEmail ?? "";
                        const qty = o.items.reduce((n, i) => n + i.quantity, 0);
                        const failed =
                            o.status === "COMPLETED" && (!!o.ticketsSendError || !o.ticketsSentAt);
                        return (
                            <li
                                key={o.id}
                                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium">{buyer}</p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {email}
                                    </p>
                                    <p className="mt-1 truncate text-xs text-muted-foreground">
                                        <Link
                                            href={`/dashboard/events/${o.event.id}?tab=ventes`}
                                            className="hover:text-foreground"
                                        >
                                            {o.event.title}
                                        </Link>{" "}
                                        · <span className="font-mono">{o.reference}</span> ·{" "}
                                        {fmtDateTime(o.createdAt)}
                                    </p>
                                    {failed && (
                                        <p className="mt-1 text-xs text-destructive">
                                            Billets non délivrés
                                            {o.ticketsSendError ? ` : ${o.ticketsSendError}` : ""}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                                    <span className="text-sm font-semibold tabular-nums">
                                        {formatXOF(o.totalAmount)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {qty} billet{qty > 1 ? "s" : ""}
                                    </span>
                                    <StatusBadge tone={badge.tone} label={badge.label} icon={badge.icon} />
                                </div>
                                {o.status === "COMPLETED" && (
                                    <ResendTicketsButton
                                        orderId={o.id}
                                        asOrganizer
                                        label={failed ? "Renvoyer" : "Renvoyer les billets"}
                                    />
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {pages > 1 && (
                <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
                    {page > 1 ? (
                        <Link href={hrefWith({ page: String(page - 1) })} className="text-secondary">
                            Précédent
                        </Link>
                    ) : (
                        <span />
                    )}
                    <span className="text-muted-foreground">
                        Page {page} sur {pages}
                    </span>
                    {page < pages ? (
                        <Link href={hrefWith({ page: String(page + 1) })} className="text-secondary">
                            Suivant
                        </Link>
                    ) : (
                        <span />
                    )}
                </nav>
            )}
        </div>
    );
}
