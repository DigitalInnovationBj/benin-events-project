import { getCurrentUser } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    IconCalendarEvent,
    IconHeart,
    IconTrendingUp,
    IconUsers,
    IconShoppingBag,
    IconClock,
    IconCircleCheck,
    IconAlertCircle,
    IconCirclePlus,
    IconArrowRight,
    IconStar,
} from "@tabler/icons-react";
import { StatusBadge, orderStatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount: number) {
    return amount >= 1_000_000
        ? `${(amount / 1_000_000).toFixed(1)} M FCFA`
        : amount >= 1_000
          ? `${(amount / 1_000).toFixed(0)} k FCFA`
          : `${amount} FCFA`;
}

function StatCard({
    label,
    value,
    sub,
    icon: Icon,
    accent,
}: {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ElementType;
    accent?: string;
}) {
    return (
        <div className="bg-card border rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div
                className={`p-2.5 rounded-xl shrink-0 ${accent ?? "bg-secondary/10"}`}
            >
                <Icon
                    className={`w-4 h-4 ${accent ? "text-white" : "text-secondary"}`}
                />
            </div>
            <div className="min-w-0">
                <p className="text-lg font-bold leading-tight truncate">
                    {value}
                </p>
                <p className="text-xs font-medium text-muted-foreground truncate">
                    {label}
                </p>
                {sub && (
                    <p className="text-xs text-muted-foreground/70 truncate">
                        {sub}
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
    const dbUser = await getCurrentUser();
    if (!dbUser) redirect("/sign-in");

    const displayName = dbUser.name || dbUser.email.split("@")[0];

    const role = dbUser.role;

    // ── Données communes ─────────────────────────────────────────────────────
    const [recentOrders, favoritesCount, agentEvents] = await Promise.all([
        prisma.order.findMany({
            where: { userId: dbUser.id },
            include: { event: true, items: { include: { ticket: true } } },
            orderBy: { createdAt: "desc" },
            take: 5,
        }),
        prisma.favorite.count({ where: { userId: dbUser.id } }),
        prisma.eventAgent.findMany({
            where: { userId: dbUser.id, status: "CONFIRMED" },
            include: { event: true },
            orderBy: { createdAt: "desc" },
            take: 3,
        }),
    ]);

    const totalSpent = recentOrders
        .filter((o) => o.status === "COMPLETED")
        .reduce((sum, o) => sum + o.totalAmount, 0);

    const completedOrders = recentOrders.filter(
        (o) => o.status === "COMPLETED",
    ).length;

    // ── Données ORGANIZER / ADMIN ────────────────────────────────────────────
    let organizerData = null;
    if (role === "ORGANIZER" || role === "ADMIN") {
        const whereEvents = role === "ADMIN" ? {} : { organizerId: dbUser.id };

        const [events, orderStats, recentSales, pendingRequests] =
            await Promise.all([
                prisma.event.findMany({
                    where: { ...whereEvents, isDeleted: false },
                    include: {
                        _count: { select: { orders: true } },
                        orders: {
                            where: { status: "COMPLETED" },
                            include: { items: true },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    take: role === "ADMIN" ? 5 : 10,
                }),
                prisma.order.aggregate({
                    where: {
                        status: "COMPLETED",
                        ...(role === "ORGANIZER"
                            ? { event: { organizerId: dbUser.id } }
                            : {}),
                    },
                    _sum: { totalAmount: true },
                    _count: true,
                }),
                prisma.order.findMany({
                    where: {
                        status: "COMPLETED",
                        ...(role === "ORGANIZER"
                            ? { event: { organizerId: dbUser.id } }
                            : {}),
                    },
                    include: { event: true, user: true, items: true },
                    orderBy: { createdAt: "desc" },
                    take: 5,
                }),
                role === "ADMIN"
                    ? prisma.organizerRequest.count({
                          where: { status: "PENDING" },
                      })
                    : Promise.resolve(0),
            ]);

        const totalTicketsSold = events.reduce(
            (sum, e) =>
                sum +
                e.orders.reduce(
                    (s, o) => s + o.items.reduce((q, i) => q + i.quantity, 0),
                    0,
                ),
            0,
        );

        let adminStats = null;
        if (role === "ADMIN") {
            const [totalUsers, totalEvents, totalOrders] = await Promise.all([
                prisma.user.count(),
                prisma.event.count({ where: { isDeleted: false } }),
                prisma.order.count({ where: { status: "COMPLETED" } }),
            ]);
            adminStats = { totalUsers, totalEvents, totalOrders };
        }

        organizerData = {
            events,
            revenue: orderStats._sum.totalAmount ?? 0,
            ordersCount: orderStats._count,
            totalTicketsSold,
            recentSales,
            pendingRequests,
            adminStats,
        };
    }

    const upcomingEvents = recentOrders
        .filter(
            (o) =>
                o.status === "COMPLETED" &&
                new Date(o.event.startDate) > new Date(),
        )
        .slice(0, 3);

    return (
        <div className="max-w-6xl mx-auto w-full space-y-5 pb-8">
            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-afo truncate">
                        Bonjour, {displayName} 👋
                    </h1>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                        {role === "ADMIN"
                            ? "Vue administrateur"
                            : role === "ORGANIZER"
                              ? "Tableau de bord organisateur"
                              : "Votre espace personnel"}
                    </p>
                </div>
                <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                        role === "ADMIN"
                            ? "bg-red-100 text-red-700"
                            : role === "ORGANIZER"
                              ? "bg-secondary/20 text-secondary"
                              : "bg-zinc-100 text-zinc-600"
                    }`}
                >
                    {role === "ADMIN"
                        ? "Admin"
                        : role === "ORGANIZER"
                          ? "Organisateur"
                          : "Utilisateur"}
                </span>
            </div>

            {/* ── Stats globales ADMIN ──────────────────────────────────── */}
            {role === "ADMIN" && organizerData?.adminStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard
                        label="Utilisateurs"
                        value={organizerData.adminStats.totalUsers}
                        icon={IconUsers}
                        accent="bg-blue-500"
                    />
                    <StatCard
                        label="Évènements"
                        value={organizerData.adminStats.totalEvents}
                        icon={IconCalendarEvent}
                        accent="bg-purple-500"
                    />
                    <StatCard
                        label="Commandes"
                        value={organizerData.adminStats.totalOrders}
                        icon={IconShoppingBag}
                        accent="bg-emerald-500"
                    />
                    <StatCard
                        label="Demandes"
                        value={organizerData.pendingRequests}
                        icon={IconAlertCircle}
                        accent={
                            organizerData.pendingRequests > 0
                                ? "bg-orange-500"
                                : "bg-zinc-400"
                        }
                    />
                </div>
            )}

            {/* ── Stats ORGANIZER ───────────────────────────────────────── */}
            {(role === "ORGANIZER" || role === "ADMIN") && organizerData && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <StatCard
                        label="Évènements"
                        value={organizerData.events.length}
                        icon={IconCalendarEvent}
                    />
                    <StatCard
                        label="Billets vendus"
                        value={organizerData.totalTicketsSold}
                        icon={IconShoppingBag}
                    />
                    <StatCard
                        label="Revenus"
                        value={fmt(organizerData.revenue)}
                        icon={IconTrendingUp}
                        accent="bg-secondary"
                    />
                </div>
            )}

            {/* ── Stats USER ────────────────────────────────────────────── */}
            {role === "USER" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <StatCard
                        label="Commandes"
                        value={completedOrders}
                        icon={IconShoppingBag}
                    />
                    <StatCard
                        label="Dépensé"
                        value={fmt(totalSpent)}
                        icon={IconTrendingUp}
                        accent="bg-secondary"
                    />
                    <StatCard
                        label="Favoris"
                        value={favoritesCount}
                        icon={IconHeart}
                    />
                </div>
            )}

            {/* ── Corps principal ───────────────────────────────────────── */}
            {/* Sur mobile : actions d'abord, puis contenu. Sur desktop : contenu | actions */}
            <div className="grid lg:grid-cols-3 gap-5">
                {/* Colonne principale — order-2 mobile, order-1 desktop */}
                <div className="lg:col-span-2 space-y-5 order-2 lg:order-1">
                    {/* Commandes récentes (USER) */}
                    {role === "USER" && (
                        <Section
                            title="Commandes récentes"
                            action={
                                <Link href="/mes-billets">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-1 text-xs h-7 px-2"
                                    >
                                        Tout voir{" "}
                                        <IconArrowRight className="w-3 h-3" />
                                    </Button>
                                </Link>
                            }
                        >
                            {recentOrders.length === 0 ? (
                                <Empty text="Aucune commande pour le moment." />
                            ) : (
                                <div className="space-y-2">
                                    {recentOrders.map((order) => (
                                        <div
                                            key={order.id}
                                            className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate">
                                                    {order.event.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground font-mono">
                                                    #
                                                    {order.reference.slice(
                                                        0,
                                                        12,
                                                    )}
                                                    …
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <StatusBadge {...orderStatusBadge(order.status)} />
                                                <span className="text-xs font-bold">
                                                    {fmt(order.totalAmount)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Section>
                    )}

                    {/* Ventes récentes (ORGANIZER / ADMIN) */}
                    {(role === "ORGANIZER" || role === "ADMIN") &&
                        organizerData && (
                            <Section title="Ventes récentes">
                                {organizerData.recentSales.length === 0 ? (
                                    <Empty text="Aucune vente pour le moment." />
                                ) : (
                                    <div className="space-y-2">
                                        {organizerData.recentSales.map(
                                            (order) => (
                                                <div
                                                    key={order.id}
                                                    className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/30 transition-colors"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm truncate">
                                                            {order.event.title}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {order.user?.name ?? order.user?.email ?? order.guestName ?? order.guestEmail ?? "Invité"}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                                                        <span className="text-xs font-bold">
                                                            {fmt(
                                                                order.totalAmount,
                                                            )}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {order.items.reduce(
                                                                (s, i) =>
                                                                    s +
                                                                    i.quantity,
                                                                0,
                                                            )}{" "}
                                                            billet(s)
                                                        </span>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </Section>
                        )}

                    {/* Évènements (ORGANIZER / ADMIN) */}
                    {(role === "ORGANIZER" || role === "ADMIN") &&
                        organizerData && (
                            <Section
                                title={
                                    role === "ADMIN"
                                        ? "Derniers évènements"
                                        : "Mes évènements"
                                }
                                action={
                                    <Link href="/dashboard/events">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="gap-1 text-xs h-7 px-2"
                                        >
                                            Tout voir{" "}
                                            <IconArrowRight className="w-3 h-3" />
                                        </Button>
                                    </Link>
                                }
                            >
                                {organizerData.events.length === 0 ? (
                                    <Empty text="Aucun évènement créé." />
                                ) : (
                                    <div className="space-y-2">
                                        {organizerData.events.map((event) => {
                                            const ticketsSold =
                                                event.orders.reduce(
                                                    (s, o) =>
                                                        s +
                                                        o.items.reduce(
                                                            (q, i) =>
                                                                q + i.quantity,
                                                            0,
                                                        ),
                                                    0,
                                                );
                                            const revenue = event.orders.reduce(
                                                (s, o) => s + o.totalAmount,
                                                0,
                                            );
                                            return (
                                                <div
                                                    key={event.id}
                                                    className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/30 transition-colors"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="font-semibold text-sm truncate">
                                                                {event.title}
                                                            </p>
                                                            {event.isFeatured && (
                                                                <IconStar className="w-3 h-3 text-yellow-500 fill-yellow-400 shrink-0" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {format(
                                                                new Date(
                                                                    event.startDate,
                                                                ),
                                                                "d MMM yyyy",
                                                                { locale: fr },
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                                                        <span className="text-xs font-bold">
                                                            {fmt(revenue)}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {ticketsSold}{" "}
                                                            billet(s)
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Section>
                        )}
                </div>

                {/* Colonne latérale — order-1 mobile (en haut), order-2 desktop */}
                <div className="space-y-5 order-1 lg:order-2">
                    {/* Actions rapides */}
                    <Section title="Actions rapides">
                        <div className="space-y-2">
                            <Link href="/mes-billets" className="block">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-2 h-10 text-sm"
                                >
                                    <IconShoppingBag className="w-4 h-4 shrink-0" />
                                    Mes commandes
                                </Button>
                            </Link>
                            <Link href="/events" className="block">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-2 h-10 text-sm"
                                >
                                    <IconCalendarEvent className="w-4 h-4 shrink-0" />
                                    Parcourir les évènements
                                </Button>
                            </Link>

                            {role === "USER" && (
                                <Link
                                    href="/dashboard/demande-organisateur"
                                    className="block"
                                >
                                    <Button className="w-full justify-start gap-2 h-10 text-sm bg-secondary/10 text-secondary hover:bg-secondary/20 border border-secondary/30">
                                        <IconCirclePlus className="w-4 h-4 shrink-0" />
                                        Devenir organisateur
                                    </Button>
                                </Link>
                            )}

                            {(role === "ORGANIZER" || role === "ADMIN") && (
                                <>
                                    <Link
                                        href="/dashboard/events/new"
                                        className="block"
                                    >
                                        <Button className="w-full justify-start gap-2 h-10 text-sm bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                                            <IconCirclePlus className="w-4 h-4 shrink-0" />
                                            Créer un évènement
                                        </Button>
                                    </Link>
                                    <Link
                                        href="/dashboard/events"
                                        className="block"
                                    >
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-2 h-10 text-sm"
                                        >
                                            <IconCalendarEvent className="w-4 h-4 shrink-0" />
                                            Mes évènements
                                        </Button>
                                    </Link>
                                </>
                            )}

                            {role === "ADMIN" && (
                                <>
                                    <Link
                                        href="/admin/requests"
                                        className="block"
                                    >
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-2 h-10 text-sm border-orange-300 text-orange-700 hover:bg-orange-50"
                                        >
                                            <IconAlertCircle className="w-4 h-4 shrink-0" />
                                            <span className="truncate">
                                                Demandes
                                                {organizerData?.pendingRequests
                                                    ? ` (${organizerData.pendingRequests})`
                                                    : ""}
                                            </span>
                                        </Button>
                                    </Link>
                                    <Link href="/admin" className="block">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-2 h-10 text-sm"
                                        >
                                            <IconUsers className="w-4 h-4 shrink-0" />
                                            Panneau admin
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </Section>

                    {/* Missions agent confirmées */}
                    {agentEvents.length > 0 && (
                        <Section title="Missions agent">
                            <div className="space-y-2">
                                {agentEvents.map((a) => (
                                    <Link
                                        key={a.id}
                                        href={`/agent/${a.eventId}/scan`}
                                        className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">
                                                {a.event.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(
                                                    new Date(a.event.startDate),
                                                    "d MMM yyyy",
                                                    { locale: fr },
                                                )}
                                            </p>
                                        </div>
                                        <IconCircleCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                    </Link>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* Prochains événements (USER) */}
                    {role === "USER" && upcomingEvents.length > 0 && (
                        <Section
                            title="À venir"
                            icon={<IconClock className="w-4 h-4 text-secondary" />}
                        >
                            <div className="space-y-2">
                                {upcomingEvents.map((o) => (
                                    <div
                                        key={o.id}
                                        className="p-3 rounded-xl border"
                                    >
                                        <p className="font-semibold text-sm truncate">
                                            {o.event.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {format(
                                                new Date(o.event.startDate),
                                                "EEE d MMM yyyy",
                                                { locale: fr },
                                            )}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({
    title,
    action,
    icon,
    children,
}: {
    title: string;
    action?: React.ReactNode;
    icon?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="bg-card border rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 gap-2">
                <h2 className="font-bold text-base flex items-center gap-1.5">
                    {icon}
                    {title}
                </h2>
                {action}
            </div>
            {children}
        </section>
    );
}

function Empty({ text }: { text: string }) {
    return (
        <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-xl">
            {text}
        </div>
    );
}
