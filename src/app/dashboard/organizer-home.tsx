import Link from "next/link";
import {
    IconArrowRight,
    IconCalendar,
    IconCalendarPlus,
    IconClock,
    IconMail,
    IconMapPin,
    IconScan,
    IconUsers,
    IconCircleCheck,
} from "@tabler/icons-react";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { StatusBadge, orderStatusBadge } from "@/components/ui/status-badge";
import { StatTile } from "@/components/dashboard/stat-tile";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { formatXOF, formatEventDateShort } from "@/lib/format";
import { getPayoutSummary } from "@/actions/payout.actions";
import {
    getActionItems,
    getOrganizerChecklist,
    getTicketSales,
} from "@/lib/organizer-stats";

/** Jours restants avant le début (arrondi au jour supérieur, 0 = en cours). */
function daysUntil(date: Date): number {
    return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86_400_000));
}

/**
 * Accueil de l'organisateur : le prochain évènement en premier, puis les
 * chiffres, ce qu'il reste à traiter et la prise en main.
 */
export async function OrganizerHome({
    user,
}: {
    user: { id: string; name: string };
}) {
    const now = new Date();

    const [nextEvent, revenueAgg, ticketsSold, payout, actions, checklist, recentSales] =
        await Promise.all([
            prisma.event.findFirst({
                where: {
                    organizerId: user.id,
                    isDeleted: false,
                    isCancelled: false,
                    endDate: { gte: now },
                },
                orderBy: { startDate: "asc" },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    startDate: true,
                    endDate: true,
                    location: true,
                    eventType: true,
                    isPublished: true,
                },
            }),
            prisma.order.aggregate({
                where: { status: "COMPLETED", event: { organizerId: user.id } },
                _sum: { totalAmount: true },
            }),
            prisma.orderItem.aggregate({
                where: {
                    order: { status: "COMPLETED" },
                    ticket: { event: { organizerId: user.id } },
                },
                _sum: { quantity: true },
            }),
            getPayoutSummary(),
            getActionItems(user.id),
            getOrganizerChecklist(user.id),
            prisma.order.findMany({
                where: { event: { organizerId: user.id }, status: { not: "PRINTED" } },
                select: {
                    id: true,
                    reference: true,
                    status: true,
                    totalAmount: true,
                    createdAt: true,
                    guestName: true,
                    user: { select: { name: true } },
                    event: { select: { title: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 5,
            }),
        ]);

    const sales = nextEvent ? await getTicketSales(nextEvent.id) : [];
    const maxSold = Math.max(1, ...sales.map((s) => s.sold));
    const checklistDone = checklist.every((s) => s.done);
    const hasActions =
        actions.pendingPayments > 0 ||
        actions.undeliveredOrders > 0 ||
        actions.eventsWithoutAgents.length > 0;

    return (
        <div className="mx-auto w-full max-w-6xl space-y-5 pb-10">
            <div>
                <h1 className="truncate font-afo text-2xl sm:text-3xl">
                    Bonjour, {user.name}
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Votre espace organisateur
                </p>
            </div>

            {/* ── Prochain évènement ─────────────────────────────── */}
            {nextEvent ? (
                <section className="flex flex-col gap-4 rounded-2xl bg-primary p-5 text-primary-foreground sm:flex-row sm:items-end sm:justify-between sm:p-6">
                    <div className="min-w-0">
                        <p className="text-sm text-secondary">
                            Prochain évènement ·{" "}
                            {daysUntil(nextEvent.startDate) === 0
                                ? "en cours"
                                : `J-${daysUntil(nextEvent.startDate)}`}
                            {!nextEvent.isPublished && " · non publié"}
                        </p>
                        <h2 className="mt-1 font-afo text-2xl sm:text-3xl">
                            {nextEvent.title}
                        </h2>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-primary-foreground/75">
                            <span className="inline-flex items-center gap-1">
                                <IconCalendar className="size-4" aria-hidden="true" />
                                {formatEventDateShort(nextEvent.startDate)}
                                {formatEventDateShort(nextEvent.endDate) !==
                                    formatEventDateShort(nextEvent.startDate) &&
                                    ` – ${formatEventDateShort(nextEvent.endDate)}`}
                            </span>
                            {nextEvent.eventType === "IN_PERSON" && nextEvent.location && (
                                <span className="inline-flex items-center gap-1">
                                    <IconMapPin className="size-4" aria-hidden="true" />
                                    {nextEvent.location}
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <Button asChild variant="secondary">
                            <Link href={`/dashboard/events/${nextEvent.id}`}>
                                Gérer <IconArrowRight className="size-4" aria-hidden="true" />
                            </Link>
                        </Button>
                    </div>
                </section>
            ) : (
                <section className="flex flex-col items-start gap-3 rounded-2xl bg-primary p-6 text-primary-foreground">
                    <h2 className="font-afo text-2xl">Lancez votre prochain évènement</h2>
                    <p className="text-sm text-primary-foreground/75">
                        Créez l&apos;évènement, ajoutez vos billets et commencez à vendre en
                        Mobile Money.
                    </p>
                    <Button asChild variant="secondary">
                        <Link href="/dashboard/events/new">
                            <IconCalendarPlus className="size-4" aria-hidden="true" />
                            Créer un évènement
                        </Link>
                    </Button>
                </section>
            )}

            {/* ── Chiffres clés ─────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <StatTile
                    label="Revenus"
                    value={formatXOF(revenueAgg._sum.totalAmount ?? 0, { zeroLabel: null })}
                    hint="Tous évènements"
                />
                <StatTile
                    label="Billets vendus"
                    value={ticketsSold._sum.quantity ?? 0}
                    hint="Tous évènements"
                />
                <StatTile
                    label="À reverser"
                    value={formatXOF(payout.netAvailable, { zeroLabel: null })}
                    hint={
                        <Link href="/dashboard/payout" className="underline underline-offset-2">
                            Demander un reversement
                        </Link>
                    }
                    highlight
                    className="col-span-2 md:col-span-1"
                />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                {/* ── Ventes par pass ───────────────────────────── */}
                {nextEvent && (
                    <section className="rounded-2xl border bg-card p-5">
                        <div className="mb-4 flex items-center justify-between gap-2">
                            <h2 className="font-semibold">Ventes par billet</h2>
                            <Link
                                href={`/dashboard/events/${nextEvent.id}?tab=ventes`}
                                className="text-xs font-medium text-secondary"
                            >
                                Détail
                            </Link>
                        </div>
                        {sales.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Aucun billet configuré.{" "}
                                <Link
                                    href={`/dashboard/events/${nextEvent.id}?tab=billets`}
                                    className="text-secondary underline underline-offset-2"
                                >
                                    Ajouter des billets
                                </Link>
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {sales.map((s) => (
                                    <li key={s.id} className="flex items-center gap-3 text-sm">
                                        <span className="w-28 shrink-0 truncate sm:w-36">{s.title}</span>
                                        <div className="h-2 flex-1 rounded-full bg-muted">
                                            <div
                                                className="h-2 rounded-full bg-secondary"
                                                style={{ width: `${(s.sold / maxSold) * 100}%` }}
                                            />
                                        </div>
                                        <span className="w-10 text-right tabular-nums">{s.sold}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                )}

                {/* ── À traiter ─────────────────────────────────── */}
                <section className="rounded-2xl border bg-card p-5">
                    <h2 className="mb-1 font-semibold">À traiter</h2>
                    {!hasActions ? (
                        <p className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                            <IconCircleCheck className="size-5 text-success" aria-hidden="true" />
                            Rien à signaler pour le moment.
                        </p>
                    ) : (
                        <ul className="text-sm">
                            {actions.pendingPayments > 0 && (
                                <ActionRow
                                    icon={<IconClock className="size-4 text-warning" aria-hidden="true" />}
                                    label={`${actions.pendingPayments} paiement${actions.pendingPayments > 1 ? "s" : ""} en cours`}
                                    href="/dashboard/commandes?status=PENDING"
                                    cta="Voir"
                                />
                            )}
                            {actions.undeliveredOrders > 0 && (
                                <ActionRow
                                    icon={<IconMail className="size-4 text-destructive" aria-hidden="true" />}
                                    label={`${actions.undeliveredOrders} commande${actions.undeliveredOrders > 1 ? "s" : ""} aux billets non délivrés`}
                                    href="/dashboard/commandes?delivery=failed"
                                    cta="Renvoyer"
                                />
                            )}
                            {actions.eventsWithoutAgents.map((e) => (
                                <ActionRow
                                    key={e.id}
                                    icon={<IconUsers className="size-4 text-muted-foreground" aria-hidden="true" />}
                                    label={`Aucun agent pour « ${e.title} »`}
                                    href={`/dashboard/events/${e.id}?tab=equipe`}
                                    cta="Inviter"
                                />
                            ))}
                        </ul>
                    )}
                    <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                        <Link href="/dashboard/scan">
                            <IconScan className="size-4" aria-hidden="true" />
                            Ouvrir le contrôle d&apos;accès
                        </Link>
                    </Button>
                </section>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                {/* ── Dernières commandes ───────────────────────── */}
                <section className="rounded-2xl border bg-card p-5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <h2 className="font-semibold">Dernières commandes</h2>
                        <Link href="/dashboard/commandes" className="text-xs font-medium text-secondary">
                            Tout voir
                        </Link>
                    </div>
                    {recentSales.length === 0 ? (
                        <p className="py-3 text-sm text-muted-foreground">
                            Les commandes apparaîtront ici dès la première vente.
                        </p>
                    ) : (
                        <ul>
                            {recentSales.map((o) => {
                                const badge = orderStatusBadge(o.status);
                                return (
                                    <li
                                        key={o.id}
                                        className="flex items-center gap-3 border-t py-2.5 text-sm first:border-t-0"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium">
                                                {o.user?.name ?? o.guestName ?? "Client"}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {o.event.title} · {o.reference}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-1">
                                            <span className="text-xs font-semibold tabular-nums">
                                                {formatXOF(o.totalAmount)}
                                            </span>
                                            <StatusBadge tone={badge.tone} label={badge.label} />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                {/* ── Prise en main ─────────────────────────────── */}
                {!checklistDone && <OnboardingChecklist steps={checklist} showGuideLink />}
            </div>
        </div>
    );
}

function ActionRow({
    icon,
    label,
    href,
    cta,
}: {
    icon: React.ReactNode;
    label: string;
    href: string;
    cta: string;
}) {
    return (
        <li className="flex items-center justify-between gap-3 border-t py-2.5 first:border-t-0">
            <span className="flex min-w-0 items-center gap-2">
                {icon}
                <span className="truncate">{label}</span>
            </span>
            <Link href={href} className="shrink-0 text-xs font-medium text-secondary">
                {cta}
            </Link>
        </li>
    );
}
