import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
    IconAlertCircle,
    IconArrowLeft,
    IconCalendar,
    IconCircleCheck,
    IconDeviceDesktop,
    IconDownload,
    IconExternalLink,
    IconMapPin,
    IconPencil,
    IconPlus,
    IconScan,
    IconStar,
    IconUserCircle,
} from "@tabler/icons-react";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { StatusBadge, agentStatusBadge, orderStatusBadge } from "@/components/ui/status-badge";
import { HelpCallout } from "@/components/dashboard/help-callout";
import { StatTile } from "@/components/dashboard/stat-tile";
import { formatEventDateShort, formatXOF } from "@/lib/format";
import { eventDayKeys, formatDayKey } from "@/lib/ticket-days";
import { getEntriesByDay, getTicketSales } from "@/lib/organizer-stats";
import { getSettings } from "@/actions/settings.actions";
import { getOrdersToRefund } from "@/actions/payment.actions";
import { getCampaignsForEvent } from "@/actions/campaign.actions";
import { listEventPartners } from "@/actions/eventPartner.actions";
import { cn } from "@/lib/utils";
import { TicketForm } from "./ticket-form";
import { TicketEditDialog } from "./ticket-edit-dialog";
import RefundPanel from "./RefundPanel";
import { EventPartnersPanel } from "./EventPartnersPanel";
import AgentInviteForm from "./agents/AgentInviteForm";
import RevokeButton from "./agents/RevokeButton";
import { DangerZone, PromotionActions, ShareEventButton, TicketOnSaleButton } from "./event-client-actions";
import { SessionsPanel } from "./sessions-panel";

// Laisse plus de marge à l'envoi de campagne en tâche de fond (next/server `after`).
export const maxDuration = 60;

/** Onglets de la page : un onglet par type d'action. */
const TABS = [
    { key: "apercu", label: "Aperçu" },
    { key: "billets", label: "Billets" },
    { key: "ventes", label: "Ventes" },
    { key: "entrees", label: "Entrées" },
    { key: "equipe", label: "Équipe" },
    { key: "promotion", label: "Promotion" },
    { key: "parametres", label: "Paramètres" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function parseTab(value: string | undefined): TabKey {
    return TABS.some((t) => t.key === value) ? (value as TabKey) : "apercu";
}

export default async function EventDetailsPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{
        tab?: string;
        created?: string;
        featured?: string;
        featured_error?: string;
    }>;
}) {
    const [{ id }, sp] = await Promise.all([params, searchParams]);
    const dbUser = await getCurrentUser();
    if (!dbUser) redirect("/sign-in");
    if (dbUser.role !== "ORGANIZER" && dbUser.role !== "ADMIN") redirect("/dashboard");

    const event = await prisma.event.findUnique({
        where: { id },
        include: eventInclude,
    });

    if (!event) {
        return (
            <div className="mx-auto max-w-5xl py-20 text-center">
                <h1 className="mb-4 text-2xl font-bold">Évènement introuvable</h1>
                <Button asChild>
                    <Link href="/dashboard/events">Retour aux évènements</Link>
                </Button>
            </div>
        );
    }
    if (dbUser.role !== "ADMIN" && event.organizerId !== dbUser.id) {
        redirect("/dashboard/events");
    }

    // Après une annulation, les remboursements sont le sujet principal.
    const tab = parseTab(sp.tab ?? (event.isCancelled ? "ventes" : undefined));
    const settings = await getSettings();
    const tabHref = (key: TabKey) =>
        key === "apercu" ? `/dashboard/events/${event.id}` : `/dashboard/events/${event.id}?tab=${key}`;

    return (
        <div className="mx-auto w-full max-w-6xl space-y-5 pb-20">
            {/* ── Bannières contextuelles ───────────────────────── */}
            {sp.created === "1" && (
                <Banner tone="success" icon={<IconCircleCheck className="size-5" />}>
                    Paiement confirmé : votre évènement est maintenant publié.
                </Banner>
            )}
            {sp.featured === "1" && (
                <Banner tone="success" icon={<IconStar className="size-5" />}>
                    Paiement confirmé : votre évènement est maintenant en vedette.
                </Banner>
            )}
            {sp.featured_error === "1" && (
                <Banner tone="danger" icon={<IconAlertCircle className="size-5" />}>
                    Le paiement de la mise en vedette a échoué. Vous pouvez réessayer
                    depuis l&apos;onglet Promotion.
                </Banner>
            )}
            {event.isCancelled ? (
                <Banner tone="danger" icon={<IconAlertCircle className="size-5" />}>
                    <strong>Évènement annulé.</strong>{" "}
                    {event.cancellationReason ||
                        "Il n'est plus visible par le public."}{" "}
                    Traitez les remboursements dans l&apos;onglet Ventes.
                </Banner>
            ) : (
                !event.isPublished && (
                    <Banner tone="warning" icon={<IconAlertCircle className="size-5" />}>
                        <strong>Non publié, en attente de paiement.</strong> Finalisez le
                        paiement de {settings.eventCreationFee.toLocaleString("fr-FR")} FCFA
                        pour rendre l&apos;évènement visible.
                    </Banner>
                )
            )}

            {/* ── En-tête ───────────────────────────────────────── */}
            <header className="space-y-3">
                <Link
                    href="/dashboard/events"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                    <IconArrowLeft className="size-4" aria-hidden="true" />
                    Mes évènements
                </Link>
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="min-w-0">
                        <h1 className="font-afo text-2xl sm:text-3xl">{event.title}</h1>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                                <IconCalendar className="size-4" aria-hidden="true" />
                                {formatEventDateShort(event.startDate)}
                                {formatEventDateShort(event.endDate) !==
                                    formatEventDateShort(event.startDate) &&
                                    ` – ${formatEventDateShort(event.endDate)}`}
                            </span>
                            {event.eventType === "IN_PERSON" && event.location ? (
                                <span className="inline-flex items-center gap-1">
                                    <IconMapPin className="size-4" aria-hidden="true" />
                                    {event.location}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1">
                                    <IconDeviceDesktop className="size-4" aria-hidden="true" />
                                    En ligne
                                </span>
                            )}
                            <EventStatus
                                isCancelled={event.isCancelled}
                                isPublished={event.isPublished}
                                isFeatured={event.isFeatured}
                            />
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {event.isPublished && !event.isCancelled && (
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/events/${event.slug}`} target="_blank">
                                    <IconExternalLink className="size-4" aria-hidden="true" />
                                    Page publique
                                </Link>
                            </Button>
                        )}
                        <ShareEventButton
                            eventId={event.id}
                            title={event.title}
                            startDate={event.startDate.toISOString()}
                            eventType={event.eventType}
                            location={event.location}
                        />
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/events/${event.id}/edit`}>
                                <IconPencil className="size-4" aria-hidden="true" />
                                Modifier
                            </Link>
                        </Button>
                    </div>
                </div>
                {dbUser.role === "ADMIN" && (
                    <p className="inline-flex items-center gap-2 rounded-xl border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                        <IconUserCircle className="size-4" aria-hidden="true" />
                        Organisé par{" "}
                        <span className="font-medium text-foreground">{event.organizer.name}</span>(
                        {event.organizer.email})
                    </p>
                )}
            </header>

            {/* ── Onglets ───────────────────────────────────────── */}
            <nav
                aria-label="Sections de l'évènement"
                className="-mx-1 flex gap-1 overflow-x-auto rounded-full border bg-card p-1"
            >
                {TABS.map((t) => (
                    <Link
                        key={t.key}
                        href={tabHref(t.key)}
                        scroll={false}
                        aria-current={tab === t.key ? "page" : undefined}
                        className={cn(
                            "whitespace-nowrap rounded-full px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                            tab === t.key &&
                                "bg-secondary font-medium text-secondary-foreground hover:text-secondary-foreground",
                        )}
                    >
                        {t.label}
                    </Link>
                ))}
            </nav>

            {tab === "apercu" && <OverviewTab event={event} />}
            {tab === "billets" && <TicketsTab event={event} />}
            {tab === "ventes" && <SalesTab event={event} />}
            {tab === "entrees" && <EntriesTab event={event} />}
            {tab === "equipe" && <TeamTab eventId={event.id} />}
            {tab === "promotion" && (
                <PromotionTab
                    event={event}
                    canFeature={
                        settings.featuredEventFeeEnabled &&
                        dbUser.role === "ORGANIZER" &&
                        !event.isFeatured &&
                        event.isPublished &&
                        !event.isCancelled
                    }
                    featuredFee={settings.featuredEventFee}
                />
            )}
            {tab === "parametres" && <SettingsTab event={event} />}
        </div>
    );
}

// ─────────────────────────────────────────────
// Éléments communs
// ─────────────────────────────────────────────

const eventInclude = {
    tickets: {
        orderBy: { price: "asc" },
        include: { sessions: { select: { sessionId: true, session: { select: { name: true } } } } },
    },
    sessions: { orderBy: [{ day: "asc" }, { createdAt: "asc" }] },
    categories: { include: { category: true } },
    organizer: { select: { name: true, email: true } },
} satisfies Prisma.EventInclude;

type EventData = Prisma.EventGetPayload<{ include: typeof eventInclude }>;

function Banner({
    tone,
    icon,
    children,
}: {
    tone: "success" | "warning" | "danger";
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div
            role="status"
            className={cn(
                "flex items-start gap-3 rounded-2xl border p-4 text-sm",
                tone === "success" && "border-success/40 bg-success/10",
                tone === "warning" && "border-warning/40 bg-warning/10",
                tone === "danger" && "border-destructive/40 bg-destructive/10",
            )}
        >
            <span
                className={cn(
                    "mt-0.5 shrink-0",
                    tone === "success" && "text-success",
                    tone === "warning" && "text-warning",
                    tone === "danger" && "text-destructive",
                )}
                aria-hidden="true"
            >
                {icon}
            </span>
            <p>{children}</p>
        </div>
    );
}

function EventStatus({
    isCancelled,
    isPublished,
    isFeatured,
}: {
    isCancelled: boolean;
    isPublished: boolean;
    isFeatured: boolean;
}) {
    if (isCancelled) return <StatusBadge tone="danger" label="Annulé" />;
    if (!isPublished) return <StatusBadge tone="warning" label="Non publié" />;
    return (
        <>
            <StatusBadge tone="success" label="Publié" />
            {isFeatured && <StatusBadge tone="warning" label="En vedette" icon={IconStar} />}
        </>
    );
}

function SectionCard({
    title,
    action,
    children,
    className,
}: {
    title?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section className={cn("rounded-2xl border bg-card p-5", className)}>
            {(title || action) && (
                <div className="mb-4 flex items-center justify-between gap-3">
                    {title && <h2 className="font-semibold">{title}</h2>}
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}

function ticketValidity(t: { validDays: string[]; sessionNames: string[] }) {
    const days =
        t.validDays.length === 0
            ? "1 entrée"
            : t.validDays.length > 3
              ? `${t.validDays.length} jours`
              : t.validDays.map(formatDayKey).join(", ");
    return t.sessionNames.length > 0 ? `${days} + ${t.sessionNames.join(", ")}` : days;
}

// ─────────────────────────────────────────────
// Aperçu
// ─────────────────────────────────────────────

async function OverviewTab({ event }: { event: EventData }) {
    const [sales, entries] = await Promise.all([
        getTicketSales(event.id),
        getEntriesByDay(event),
    ]);
    const revenue = sales.reduce((s, t) => s + t.revenue, 0);
    const sold = sales.reduce((s, t) => s + t.sold, 0);
    const totalEntries = Object.values(entries.countByDay).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <StatTile label="Revenus" value={formatXOF(revenue, { zeroLabel: null })} highlight />
                <StatTile label="Billets vendus" value={sold} />
                <StatTile
                    label="Entrées validées"
                    value={totalEntries}
                    className="col-span-2 md:col-span-1"
                />
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                <section className="overflow-hidden rounded-2xl border bg-card">
                    <div className="relative aspect-[21/9] w-full bg-muted">
                        {event.imageUrl ? (
                            <Image src={event.imageUrl} alt={event.title} fill className="object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                                Sans image d&apos;en-tête
                            </div>
                        )}
                    </div>
                    <div className="space-y-4 p-5">
                        {event.categories.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {event.categories.map(({ category }) => (
                                    <span
                                        key={category.id}
                                        className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                                    >
                                        {category.name}
                                    </span>
                                ))}
                            </div>
                        )}
                        <div
                            className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert"
                            // Description saisie via l'éditeur riche de l'organisateur.
                            dangerouslySetInnerHTML={{ __html: event.description }}
                        />
                    </div>
                </section>

                <div className="space-y-3">
                    <SectionCard title="Raccourcis">
                        <div className="grid gap-2">
                            <Button asChild variant="secondary" className="justify-start">
                                <Link href="/dashboard/scan">
                                    <IconScan className="size-4" aria-hidden="true" />
                                    Ouvrir le scanner
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="justify-start">
                                <Link href={`/dashboard/events/${event.id}?tab=billets`}>
                                    <IconPlus className="size-4" aria-hidden="true" />
                                    Ajouter un billet
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="justify-start">
                                <a href={`/api/events/${event.id}/attendees`} download>
                                    <IconDownload className="size-4" aria-hidden="true" />
                                    Exporter les participants
                                </a>
                            </Button>
                        </div>
                    </SectionCard>
                    <HelpCallout guideAnchor="demarrer">
                        Chaque onglet regroupe un type d&apos;action : billets à
                        vendre, ventes, entrées le jour J, équipe de contrôle,
                        promotion et réglages.
                    </HelpCallout>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Billets
// ─────────────────────────────────────────────

async function TicketsTab({ event }: { event: EventData }) {
    const eventDays = eventDayKeys(event.startDate, event.endDate);
    const sessionOptions = event.sessions.map((s) => ({
        id: s.id,
        label: `${s.name} · ${formatDayKey(s.day)}`,
    }));
    const sessionItems = event.sessions.map((s) => ({
        id: s.id,
        name: s.name,
        day: s.day,
        capacity: s.capacity,
        ticketTitles: event.tickets
            .filter((t) => t.sessions.some((ts) => ts.sessionId === s.id))
            .map((t) => t.title),
    }));

    return (
        <div className="grid gap-5 lg:grid-cols-[1fr_400px]">
            <div className="space-y-4">
                <HelpCallout guideAnchor="billets">
                    Un billet sans jour coché donne une seule entrée. Cochez
                    plusieurs jours pour un pass scanné une fois par jour, et
                    les sessions (conférences…) auxquelles il donne accès.
                </HelpCallout>
                <SectionCard title={`Billets (${event.tickets.length})`}>
                    {event.tickets.length === 0 ? (
                        <p className="rounded-xl border border-dashed bg-muted/30 py-8 text-center text-sm text-muted-foreground">
                            Aucun billet pour l&apos;instant. Créez le premier avec le
                            formulaire.
                        </p>
                    ) : (
                        <ul className="space-y-3">
                            {event.tickets.map((ticket) => (
                                <li
                                    key={ticket.id}
                                    className={cn(
                                        "flex items-start justify-between gap-4 rounded-xl border p-4 transition-colors hover:border-secondary/50",
                                        ticket.isArchived && "border-dashed opacity-70",
                                    )}
                                >
                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate font-semibold">{ticket.title}</h3>
                                        {ticket.description && (
                                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                                {ticket.description}
                                            </p>
                                        )}
                                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                            <span className="rounded-md bg-secondary/15 px-2 py-0.5 font-medium text-secondary">
                                                {formatXOF(ticket.price)}
                                            </span>
                                            <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                                                {ticketValidity({ validDays: ticket.validDays, sessionNames: [] })}
                                            </span>
                                            {ticket.sessions.map((ts) => (
                                                <span key={ts.sessionId} className="rounded-md bg-primary/30 px-2 py-0.5 text-foreground">
                                                    Accès : {ts.session.name}
                                                </span>
                                            ))}
                                            {ticket.totalStock != null && (
                                                <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                                                    Stock : {ticket.totalStock}
                                                </span>
                                            )}
                                            {ticket.isArchived && (
                                                <StatusBadge tone="warning" label="Retiré de la vente" />
                                            )}
                                        </div>
                                        {ticket.isArchived && (
                                            <div className="mt-3">
                                                <TicketOnSaleButton ticketId={ticket.id} />
                                            </div>
                                        )}
                                    </div>
                                    <TicketEditDialog
                                        ticket={{ ...ticket, sessionIds: ticket.sessions.map((ts) => ts.sessionId) }}
                                        eventDays={eventDays}
                                        sessionOptions={sessionOptions}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </SectionCard>
                <SessionsPanel eventId={event.id} eventDays={eventDays} sessions={sessionItems} />
            </div>
            <SectionCard title="Ajouter un billet" className="h-fit">
                <TicketForm eventId={event.id} eventDays={eventDays} sessionOptions={sessionOptions} />
            </SectionCard>
        </div>
    );
}

// ─────────────────────────────────────────────
// Ventes
// ─────────────────────────────────────────────

async function SalesTab({ event }: { event: EventData }) {
    const [sales, recentOrders, pendingCount, refund] = await Promise.all([
        getTicketSales(event.id),
        prisma.order.findMany({
            where: { eventId: event.id },
            select: {
                id: true,
                reference: true,
                status: true,
                totalAmount: true,
                createdAt: true,
                guestName: true,
                user: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 8,
        }),
        prisma.order.count({ where: { eventId: event.id, status: "PENDING" } }),
        event.isCancelled ? getOrdersToRefund(event.id) : Promise.resolve({ orders: [] }),
    ]);
    const revenue = sales.reduce((s, t) => s + t.revenue, 0);
    const sold = sales.reduce((s, t) => s + t.sold, 0);

    return (
        <div className="space-y-5">
            {event.isCancelled && refund.orders.length > 0 && (
                <RefundPanel
                    orders={refund.orders.map((o) => ({
                        id: o.id,
                        reference: o.reference,
                        totalAmount: o.totalAmount,
                        status: o.status as "COMPLETED" | "REFUNDED",
                        buyerName: o.user?.name ?? o.guestName ?? "Client",
                        buyerEmail: o.user?.email ?? o.guestEmail ?? "",
                    }))}
                />
            )}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <StatTile label="Revenus" value={formatXOF(revenue, { zeroLabel: null })} highlight />
                <StatTile label="Billets vendus" value={sold} />
                <StatTile
                    label="Paiements en cours"
                    value={pendingCount}
                    className="col-span-2 md:col-span-1"
                />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                <SectionCard title="Par billet">
                    {sales.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucun billet configuré.</p>
                    ) : (
                        <table className="w-full table-fixed text-sm">
                            <thead>
                                <tr className="text-left text-xs text-muted-foreground">
                                    <th className="pb-2 font-normal">Billet</th>
                                    <th className="w-16 pb-2 text-right font-normal">Vendus</th>
                                    <th className="w-20 pb-2 text-right font-normal">Restant</th>
                                    <th className="w-28 pb-2 text-right font-normal">Revenu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map((s) => (
                                    <tr key={s.id} className="border-t">
                                        <td className="truncate py-2.5">{s.title}</td>
                                        <td className="py-2.5 text-right tabular-nums">{s.sold}</td>
                                        <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                                            {s.totalStock == null ? "∞" : Math.max(0, s.totalStock - s.sold)}
                                        </td>
                                        <td className="py-2.5 text-right tabular-nums">
                                            {formatXOF(s.revenue, { zeroLabel: null })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </SectionCard>

                <SectionCard
                    title="Dernières commandes"
                    action={
                        <Link
                            href={`/dashboard/commandes?event=${event.id}`}
                            className="text-xs font-medium text-secondary"
                        >
                            Tout voir
                        </Link>
                    }
                >
                    {recentOrders.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucune commande pour l&apos;instant.</p>
                    ) : (
                        <ul>
                            {recentOrders.map((o) => {
                                const badge = orderStatusBadge(o.status);
                                return (
                                    <li key={o.id} className="flex items-center gap-3 border-t py-2.5 text-sm first:border-t-0">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium">{o.user?.name ?? o.guestName ?? "Client"}</p>
                                            <p className="truncate font-mono text-xs text-muted-foreground">{o.reference}</p>
                                        </div>
                                        <span className="text-xs font-semibold tabular-nums">{formatXOF(o.totalAmount)}</span>
                                        <StatusBadge tone={badge.tone} label={badge.label} />
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </SectionCard>
            </div>
            <HelpCallout guideAnchor="ventes">
                Les revenus comptent les commandes payées. La commission Benin
                Events est déduite au moment du reversement, dans Finances.
            </HelpCallout>
        </div>
    );
}

// ─────────────────────────────────────────────
// Entrées
// ─────────────────────────────────────────────

async function EntriesTab({ event }: { event: EventData }) {
    const [entries, sales] = await Promise.all([getEntriesByDay(event), getTicketSales(event.id)]);

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">Billets scannés à l&apos;entrée, jour par jour</p>
                <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                        <a href={`/api/events/${event.id}/attendees`} download>
                            <IconDownload className="size-4" aria-hidden="true" />
                            Exporter
                        </a>
                    </Button>
                    <Button asChild variant="secondary" size="sm">
                        <Link href={`/agent/${event.id}/scan`}>
                            <IconScan className="size-4" aria-hidden="true" />
                            Ouvrir le scanner
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {entries.days.map((day) => {
                    const isToday = day === entries.today;
                    const isFuture = day > entries.today;
                    return (
                        <div
                            key={day}
                            className={cn("rounded-2xl border bg-card p-4", isToday && "border-secondary")}
                        >
                            <p className={cn("text-xs", isToday ? "text-secondary" : "text-muted-foreground")}>
                                {formatDayKey(day)}
                                {isToday && " · aujourd'hui"}
                            </p>
                            <p className={cn("mt-1 text-2xl font-semibold tabular-nums", isFuture && "text-muted-foreground")}>
                                {isFuture ? "—" : entries.countByDay[day] ?? 0}
                            </p>
                        </div>
                    );
                })}
            </div>

            {entries.sessions.length > 0 && (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {entries.sessions.map((s) => (
                        <div key={s.id} className="rounded-2xl bg-primary p-4 text-primary-foreground">
                            <p className="truncate text-xs text-secondary">
                                {s.name} · {formatDayKey(s.day)}
                            </p>
                            <p className="mt-1 text-2xl font-semibold tabular-nums">
                                {s.entered}
                                <span className="ml-1 text-xs font-normal text-primary-foreground/70">
                                    / {s.capacity ?? s.eligible} {s.capacity != null ? "places" : "ayants droit"}
                                </span>
                            </p>
                            <Link
                                href={`/agent/${event.id}/scan?point=${s.id}`}
                                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-secondary"
                            >
                                <IconScan className="size-3.5" aria-hidden="true" />
                                Scanner cette session
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            <SectionCard title="Par billet">
                <table className="w-full table-fixed text-sm">
                    <thead>
                        <tr className="text-left text-xs text-muted-foreground">
                            <th className="pb-2 font-normal">Billet</th>
                            <th className="hidden pb-2 font-normal sm:table-cell">Validité</th>
                            <th className="w-16 pb-2 text-right font-normal">Vendus</th>
                            <th className="w-28 pb-2 text-right font-normal">Entrés aujourd&apos;hui</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map((s) => (
                            <tr key={s.id} className="border-t">
                                <td className="truncate py-2.5">{s.title}</td>
                                <td className="hidden truncate py-2.5 text-muted-foreground sm:table-cell">{ticketValidity(s)}</td>
                                <td className="py-2.5 text-right tabular-nums">{s.sold}</td>
                                <td className="py-2.5 text-right tabular-nums">{entries.todayByTicket[s.id] ?? 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </SectionCard>

            <HelpCallout guideAnchor="jour-j">
                Un pass multi-jours se scanne une fois par jour à l&apos;entrée
                générale. Les sessions (conférences…) ont leur propre point de
                contrôle et leurs propres compteurs.
            </HelpCallout>
        </div>
    );
}

// ─────────────────────────────────────────────
// Équipe
// ─────────────────────────────────────────────

async function TeamTab({ eventId }: { eventId: string }) {
    const agents = await prisma.eventAgent.findMany({
        where: { eventId },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" },
    });

    return (
        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
            <SectionCard title={`Agents de contrôle (${agents.length})`}>
                {agents.length === 0 ? (
                    <p className="rounded-xl border border-dashed bg-muted/30 py-8 text-center text-sm text-muted-foreground">
                        Aucun agent pour l&apos;instant. Invitez les personnes qui
                        scanneront les billets à l&apos;entrée.
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {agents.map((agent) => {
                            const badge = agentStatusBadge(agent.status);
                            return (
                                <li key={agent.id} className="flex items-center justify-between gap-4 rounded-xl border p-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium">{agent.user.name ?? agent.user.email}</p>
                                        <p className="truncate text-xs text-muted-foreground">{agent.user.email}</p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <StatusBadge tone={badge.tone} label={badge.label} icon={badge.icon} />
                                        {agent.status !== "REVOKED" && (
                                            <RevokeButton eventId={eventId} targetUserId={agent.userId} />
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </SectionCard>
            <div className="space-y-4">
                <SectionCard title="Inviter un agent">
                    <AgentInviteForm eventId={eventId} />
                </SectionCard>
                <HelpCallout guideAnchor="jour-j">
                    L&apos;agent doit avoir un compte Benin Events. Il reçoit un
                    email de confirmation, puis accède au scanner depuis son
                    propre tableau de bord.
                </HelpCallout>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Promotion
// ─────────────────────────────────────────────

async function PromotionTab({
    event,
    canFeature,
    featuredFee,
}: {
    event: EventData;
    canFeature: boolean;
    featuredFee: number;
}) {
    const [{ remaining, nextAvailableAt }, { partners }] = await Promise.all([
        getCampaignsForEvent(event.id),
        listEventPartners(event.id),
    ]);

    return (
        <div className="space-y-5">
            <PromotionActions
                eventId={event.id}
                eventTitle={event.title}
                canFeature={canFeature}
                featuredFee={featuredFee}
                isFeatured={event.isFeatured}
                campaignRemaining={remaining}
                campaignNextAvailableAt={nextAvailableAt ? nextAvailableAt.toISOString() : null}
            />
            <EventPartnersPanel eventId={event.id} initialPartners={partners} />
            <HelpCallout guideAnchor="promotion">
                Donnez un code promo à chaque partenaire ou influenceur : vous
                voyez combien de ventes il apporte.
            </HelpCallout>
        </div>
    );
}

// ─────────────────────────────────────────────
// Paramètres
// ─────────────────────────────────────────────

function SettingsTab({ event }: { event: EventData }) {
    return (
        <div className="grid gap-5 lg:grid-cols-2">
            <SectionCard
                title="Informations"
                action={
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/events/${event.id}/edit`}>
                            <IconPencil className="size-4" aria-hidden="true" />
                            Modifier
                        </Link>
                    </Button>
                }
            >
                <dl className="space-y-3 text-sm">
                    <Row label="Titre" value={event.title} />
                    <Row
                        label="Dates"
                        value={`${formatEventDateShort(event.startDate)} – ${formatEventDateShort(event.endDate)}`}
                    />
                    <Row
                        label="Lieu"
                        value={event.eventType === "IN_PERSON" ? (event.location ?? "—") : "En ligne"}
                    />
                    <Row label="Lien public" value={`/events/${event.slug}`} />
                </dl>
            </SectionCard>

            <SectionCard title="Message après achat">
                {event.postPurchaseMessage ? (
                    <div
                        className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: event.postPurchaseMessage }}
                    />
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Aucun message. Ajoutez-en un (lien WhatsApp, accès,
                        stationnement) via « Modifier ».
                    </p>
                )}
            </SectionCard>

            <div className="lg:col-span-2">
                <DangerZone
                    eventId={event.id}
                    eventTitle={event.title}
                    canCancel={!event.isCancelled && !event.isDeleted}
                />
            </div>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4 border-t pt-3 first:border-t-0 first:pt-0">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="truncate text-right">{value}</dd>
        </div>
    );
}
