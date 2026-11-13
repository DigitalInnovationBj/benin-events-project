import Link from "next/link";
import {
    IconCash,
    IconCircleCheck,
    IconHeartHandshake,
    IconShieldCheck,
} from "@tabler/icons-react";
import prisma from "@/lib/prisma";
import { StatusBadge, orderStatusBadge } from "@/components/ui/status-badge";
import { StatTile } from "@/components/dashboard/stat-tile";
import { formatXOF } from "@/lib/format";
import { getAdminQueue } from "@/lib/admin-queue";

/**
 * Accueil administrateur : chiffres de la plateforme, file des éléments à
 * valider, derniers évènements et dernières commandes.
 */
export async function AdminHome({ name }: { name: string }) {
    const now = new Date();
    const since = new Date(now.getTime() - 30 * 86_400_000);

    const [sales30d, commissions, activeEvents, users, queue, events, orders] =
        await Promise.all([
            prisma.order.aggregate({
                where: { status: "COMPLETED", createdAt: { gte: since } },
                _sum: { totalAmount: true },
            }),
            // Commissions prélevées sur les reversements payés.
            prisma.payoutRequest.aggregate({
                where: { status: "PAID" },
                _sum: { commissionAmount: true },
            }),
            prisma.event.count({
                where: {
                    isDeleted: false,
                    isCancelled: false,
                    isPublished: true,
                    endDate: { gte: now },
                },
            }),
            prisma.user.count(),
            getAdminQueue(),
            prisma.event.findMany({
                where: { isDeleted: false },
                select: {
                    id: true,
                    title: true,
                    isPublished: true,
                    isCancelled: true,
                    organizer: { select: { name: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 5,
            }),
            prisma.order.findMany({
                select: {
                    id: true,
                    status: true,
                    totalAmount: true,
                    guestName: true,
                    user: { select: { name: true } },
                    event: { select: { title: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 5,
            }),
        ]);

    const pending = queue.organizerRequests + queue.partnerRequests + queue.payouts;

    const queueRows = [
        {
            count: queue.organizerRequests,
            icon: IconShieldCheck,
            label: `${queue.organizerRequests} demande${queue.organizerRequests > 1 ? "s" : ""} organisateur`,
            href: "/admin/requests",
            cta: "Examiner",
        },
        {
            count: queue.payouts,
            icon: IconCash,
            label: `${queue.payouts} reversement${queue.payouts > 1 ? "s" : ""} · ${formatXOF(queue.payoutsAmount)}`,
            href: "/admin/payouts",
            cta: "Traiter",
        },
        {
            count: queue.partnerRequests,
            icon: IconHeartHandshake,
            label: `${queue.partnerRequests} candidature${queue.partnerRequests > 1 ? "s" : ""} partenaire`,
            href: "/admin/partner-requests",
            cta: "Examiner",
        },
    ].filter((r) => r.count > 0);

    return (
        <div className="mx-auto w-full max-w-6xl space-y-5 pb-10">
            <div>
                <h1 className="truncate font-afo text-2xl sm:text-3xl">Bonjour, {name}</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Vue d&apos;ensemble de la plateforme
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatTile
                    label="Ventes (30 jours)"
                    value={formatXOF(sales30d._sum.totalAmount ?? 0, { zeroLabel: null })}
                />
                <StatTile
                    label="Commissions perçues"
                    value={formatXOF(commissions._sum.commissionAmount ?? 0, { zeroLabel: null })}
                    hint="Sur les reversements payés"
                    highlight
                />
                <StatTile label="Évènements actifs" value={activeEvents} />
                <StatTile label="Utilisateurs" value={users.toLocaleString("fr-FR")} />
            </div>

            {/* ── À valider ─────────────────────────────────────── */}
            <section className="rounded-2xl bg-primary p-5 text-primary-foreground">
                <div className="mb-1 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">À valider</h2>
                    <span className="text-sm text-secondary">
                        {pending > 0 ? `${pending} en attente` : "À jour"}
                    </span>
                </div>
                {queueRows.length === 0 ? (
                    <p className="flex items-center gap-2 py-2 text-sm text-primary-foreground/75">
                        <IconCircleCheck className="size-5 text-secondary" aria-hidden="true" />
                        Aucune demande en attente.
                    </p>
                ) : (
                    <ul>
                        {queueRows.map((r) => (
                            <li
                                key={r.href}
                                className="flex items-center justify-between gap-3 border-t border-white/10 py-2.5 text-sm first:border-t-0"
                            >
                                <span className="flex min-w-0 items-center gap-2">
                                    <r.icon className="size-4 shrink-0 text-secondary" aria-hidden="true" />
                                    <span className="truncate">{r.label}</span>
                                </span>
                                <Link
                                    href={r.href}
                                    className="shrink-0 rounded-lg bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground"
                                >
                                    {r.cta}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
                <section className="rounded-2xl border bg-card p-5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <h2 className="font-semibold">Derniers évènements</h2>
                        <Link href="/dashboard/events" className="text-xs font-medium text-secondary">
                            Tout voir
                        </Link>
                    </div>
                    <ul>
                        {events.map((e) => (
                            <li
                                key={e.id}
                                className="flex items-center gap-3 border-t py-2.5 text-sm first:border-t-0"
                            >
                                <Link href={`/dashboard/events/${e.id}`} className="min-w-0 flex-1">
                                    <p className="truncate font-medium">{e.title}</p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {e.organizer.name}
                                    </p>
                                </Link>
                                {e.isCancelled ? (
                                    <StatusBadge tone="danger" label="Annulé" />
                                ) : e.isPublished ? (
                                    <StatusBadge tone="success" label="Publié" />
                                ) : (
                                    <StatusBadge tone="warning" label="Non publié" />
                                )}
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="rounded-2xl border bg-card p-5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <h2 className="font-semibold">Dernières commandes</h2>
                        <Link href="/dashboard/commandes" className="text-xs font-medium text-secondary">
                            Tout voir
                        </Link>
                    </div>
                    <ul>
                        {orders.map((o) => {
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
                                            {o.event.title}
                                        </p>
                                    </div>
                                    <span className="text-xs font-semibold tabular-nums">
                                        {formatXOF(o.totalAmount)}
                                    </span>
                                    <StatusBadge tone={badge.tone} label={badge.label} />
                                </li>
                            );
                        })}
                    </ul>
                </section>
            </div>
        </div>
    );
}
