import Link from "next/link";
import {
    IconCalendar,
    IconChevronRight,
    IconMapPin,
    IconQrcode,
    IconRoute,
    IconScan,
    IconSearch,
    IconTicket,
    IconUserCircle,
} from "@tabler/icons-react";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/dashboard/stat-tile";
import { formatEventDateShort } from "@/lib/format";

function daysUntil(date: Date): number {
    return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86_400_000));
}

/**
 * Accueil de l'utilisateur (acheteur) : son prochain évènement en premier,
 * ses billets à venir, et ses missions s'il est agent de contrôle.
 */
export async function UserHome({
    user,
}: {
    user: { id: string; name: string; email: string };
}) {
    const now = new Date();

    // Billets achetés par l'utilisateur (y compris en invité avec son email)
    // ou offerts par quelqu'un d'autre à son adresse.
    const mine = {
        order: { status: "COMPLETED" as const },
        OR: [
            { order: { userId: user.id } },
            { order: { guestEmail: user.email, userId: null } },
            { attendeeEmail: user.email },
        ],
    };

    const [upcomingItems, pastEvents, favorites, missions] = await Promise.all([
        prisma.orderItem.findMany({
            where: { ...mine, ticket: { event: { endDate: { gte: now }, isDeleted: false } } },
            select: {
                id: true,
                ticket: {
                    select: {
                        title: true,
                        event: {
                            select: {
                                id: true,
                                slug: true,
                                title: true,
                                startDate: true,
                                endDate: true,
                                location: true,
                                eventType: true,
                                isCancelled: true,
                            },
                        },
                    },
                },
            },
            orderBy: { ticket: { event: { startDate: "asc" } } },
        }),
        prisma.event.count({
            where: { endDate: { lt: now }, tickets: { some: { orderItems: { some: mine } } } },
        }),
        prisma.favorite.count({ where: { userId: user.id } }),
        prisma.eventAgent.findMany({
            where: { userId: user.id, status: "CONFIRMED", event: { endDate: { gte: now }, isDeleted: false } },
            select: { event: { select: { id: true, title: true, startDate: true } } },
            orderBy: { event: { startDate: "asc" } },
            take: 3,
        }),
    ]);

    // Regroupe les billets par évènement, dans l'ordre chronologique.
    const byEvent = new Map<
        string,
        { event: (typeof upcomingItems)[number]["ticket"]["event"]; titles: string[] }
    >();
    for (const item of upcomingItems) {
        const ev = item.ticket.event;
        const entry = byEvent.get(ev.id) ?? { event: ev, titles: [] };
        entry.titles.push(item.ticket.title);
        byEvent.set(ev.id, entry);
    }
    const events = [...byEvent.values()];
    const next = events[0];

    const ticketSummary = (titles: string[]) => {
        const unique = [...new Set(titles)];
        return `${titles.length} billet${titles.length > 1 ? "s" : ""} · ${unique.join(", ")}`;
    };

    return (
        <div className="mx-auto w-full max-w-6xl space-y-5 pb-10">
            <div>
                <h1 className="truncate font-afo text-2xl sm:text-3xl">Bonjour, {user.name}</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Vos billets et vos prochaines sorties
                </p>
            </div>

            {/* ── Prochain évènement ─────────────────────────────── */}
            {next ? (
                <section className="flex flex-col gap-4 rounded-2xl bg-primary p-5 text-primary-foreground sm:flex-row sm:items-end sm:justify-between sm:p-6">
                    <div className="min-w-0">
                        <p className="text-sm text-secondary">
                            Votre prochain évènement ·{" "}
                            {next.event.isCancelled
                                ? "annulé"
                                : daysUntil(next.event.startDate) === 0
                                  ? "en cours"
                                  : `J-${daysUntil(next.event.startDate)}`}
                        </p>
                        <h2 className="mt-1 font-afo text-2xl sm:text-3xl">{next.event.title}</h2>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-primary-foreground/75">
                            <span className="inline-flex items-center gap-1">
                                <IconCalendar className="size-4" aria-hidden="true" />
                                {formatEventDateShort(next.event.startDate)}
                                {formatEventDateShort(next.event.endDate) !==
                                    formatEventDateShort(next.event.startDate) &&
                                    ` – ${formatEventDateShort(next.event.endDate)}`}
                            </span>
                            {next.event.eventType === "IN_PERSON" && next.event.location && (
                                <span className="inline-flex items-center gap-1">
                                    <IconMapPin className="size-4" aria-hidden="true" />
                                    {next.event.location}
                                </span>
                            )}
                        </p>
                        <p className="mt-2 inline-flex items-center gap-1 text-sm text-primary-foreground/75">
                            <IconTicket className="size-4" aria-hidden="true" />
                            {ticketSummary(next.titles)}
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
                        <Button asChild variant="secondary">
                            <Link href="/mes-billets">
                                <IconQrcode className="size-4" aria-hidden="true" />
                                Voir mes billets
                            </Link>
                        </Button>
                        {next.event.eventType === "IN_PERSON" && next.event.location && (
                            <Button
                                asChild
                                variant="outline"
                                className="border-white/30 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
                            >
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(next.event.location)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <IconRoute className="size-4" aria-hidden="true" />
                                    Itinéraire
                                </a>
                            </Button>
                        )}
                    </div>
                </section>
            ) : (
                <section className="flex flex-col items-start gap-3 rounded-2xl bg-primary p-6 text-primary-foreground">
                    <h2 className="font-afo text-2xl">Votre prochaine sortie vous attend</h2>
                    <p className="text-sm text-primary-foreground/75">
                        Concerts, festivals, conférences : réservez en Mobile Money,
                        votre billet arrive par email.
                    </p>
                    <Button asChild variant="secondary">
                        <Link href="/events">
                            <IconSearch className="size-4" aria-hidden="true" />
                            Trouver un évènement
                        </Link>
                    </Button>
                </section>
            )}

            <div className="grid grid-cols-3 gap-3">
                <StatTile label="Billets à venir" value={upcomingItems.length} />
                <StatTile label="Évènements suivis" value={favorites} />
                <StatTile label="Évènements passés" value={pastEvents} />
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
                <section className="rounded-2xl border bg-card p-5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <h2 className="font-semibold">À venir</h2>
                        <Link href="/mes-billets" className="text-xs font-medium text-secondary">
                            Mes billets
                        </Link>
                    </div>
                    {events.length === 0 ? (
                        <p className="py-3 text-sm text-muted-foreground">
                            Vos prochains billets apparaîtront ici.
                        </p>
                    ) : (
                        <ul>
                            {events.map(({ event, titles }) => (
                                <li key={event.id} className="border-t first:border-t-0">
                                    <Link
                                        href={`/events/${event.slug}`}
                                        className="flex items-center gap-3 py-2.5 text-sm"
                                    >
                                        <span className="w-12 shrink-0 rounded-xl bg-muted py-1 text-center">
                                            <span className="block text-base font-semibold tabular-nums">
                                                {event.startDate.toLocaleDateString("fr-FR", { day: "numeric", timeZone: "Africa/Porto-Novo" })}
                                            </span>
                                            <span className="block text-[11px] text-muted-foreground">
                                                {event.startDate.toLocaleDateString("fr-FR", { month: "short", timeZone: "Africa/Porto-Novo" })}
                                            </span>
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate font-medium">{event.title}</span>
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {event.isCancelled
                                                    ? "Évènement annulé"
                                                    : `${titles.length} billet${titles.length > 1 ? "s" : ""}`}
                                            </span>
                                        </span>
                                        <IconChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <div className="space-y-5">
                    {missions.length > 0 && (
                        <section className="rounded-2xl border border-secondary/50 bg-card p-5">
                            <h2 className="mb-2 flex items-center gap-2 font-semibold">
                                <IconScan className="size-5 text-secondary" aria-hidden="true" />
                                Vos missions de contrôle
                            </h2>
                            <ul>
                                {missions.map(({ event }) => (
                                    <li key={event.id} className="flex items-center justify-between gap-3 border-t py-2.5 text-sm first:border-t-0">
                                        <span className="min-w-0">
                                            <span className="block truncate font-medium">{event.title}</span>
                                            <span className="block text-xs text-muted-foreground">
                                                {formatEventDateShort(event.startDate)}
                                            </span>
                                        </span>
                                        <Button asChild size="sm" variant="secondary">
                                            <Link href={`/agent/${event.id}/scan`}>Scanner</Link>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <section className="rounded-2xl border bg-card p-5">
                        <h2 className="mb-3 font-semibold">Raccourcis</h2>
                        <div className="grid gap-2">
                            <Button asChild variant="outline" className="justify-start">
                                <Link href="/events">
                                    <IconSearch className="size-4" aria-hidden="true" />
                                    Trouver un évènement
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="justify-start">
                                <Link href="/mes-billets">
                                    <IconTicket className="size-4" aria-hidden="true" />
                                    Renvoyer un billet par email
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="justify-start">
                                <Link href="/mon-compte">
                                    <IconUserCircle className="size-4" aria-hidden="true" />
                                    Modifier mon profil
                                </Link>
                            </Button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
