import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Ticket,
    CalendarDays,
    Heart,
    TrendingUp,
    Users,
    ShoppingBag,
    Clock,
    CheckCircle2,
    AlertCircle,
    PlusCircle,
    ArrowRight,
    Star,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
        <div className="bg-card border rounded-2xl p-5 shadow-sm flex items-start gap-4">
            <div className={`p-2.5 rounded-xl ${accent ?? "bg-secondary/10"}`}>
                <Icon className={`w-5 h-5 ${accent ? "text-white" : "text-secondary"}`} />
            </div>
            <div>
                <p className="text-2xl font-bold leading-tight">{value}</p>
                <p className="text-sm font-medium text-foreground">{label}</p>
                {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

const statusLabel: Record<string, string> = {
    PENDING: "En attente",
    COMPLETED: "Confirmée",
    FAILED: "Échouée",
    EXPIRED: "Expirée",
    CANCELLED: "Annulée",
};

const statusColor: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-emerald-100 text-emerald-800",
    FAILED: "bg-red-100 text-red-800",
    EXPIRED: "bg-zinc-100 text-zinc-600",
    CANCELLED: "bg-zinc-100 text-zinc-600",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
    const user = await currentUser();
    if (!user) redirect("/sign-in");

    const dbUser = await prisma.user.findUnique({
        where: { clerkId: user.id },
    });

    if (!dbUser) redirect("/sign-in");

    const displayName =
        dbUser.name ||
        user.firstName ||
        user.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
        "Utilisateur";

    const role = dbUser.role;

    // ── Données communes (USER) ──────────────────────────────────────────────
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
        const whereEvents =
            role === "ADMIN" ? {} : { organizerId: dbUser.id };

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
                    (s, o) =>
                        s + o.items.reduce((q, i) => q + i.quantity, 0),
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

    return (
        <div className="max-w-6xl mx-auto w-full space-y-8">
            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-afo mb-1">
                        Bonjour, {displayName} 👋
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {role === "ADMIN"
                            ? "Vue administrateur — toutes les données de la plateforme"
                            : role === "ORGANIZER"
                              ? "Tableau de bord organisateur"
                              : "Votre espace personnel Benin Events"}
                    </p>
                </div>
                <span
                    className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                        role === "ADMIN"
                            ? "bg-red-100 text-red-700"
                            : role === "ORGANIZER"
                              ? "bg-secondary/20 text-secondary"
                              : "bg-zinc-100 text-zinc-600"
                    }`}
                >
                    {role === "ADMIN"
                        ? "Administrateur"
                        : role === "ORGANIZER"
                          ? "Organisateur"
                          : "Utilisateur"}
                </span>
            </div>

            {/* ── ADMIN : stats globales ────────────────────────────────── */}
            {role === "ADMIN" && organizerData?.adminStats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Utilisateurs"
                        value={organizerData.adminStats.totalUsers}
                        icon={Users}
                        accent="bg-blue-500"
                    />
                    <StatCard
                        label="Évènements"
                        value={organizerData.adminStats.totalEvents}
                        icon={CalendarDays}
                        accent="bg-purple-500"
                    />
                    <StatCard
                        label="Commandes"
                        value={organizerData.adminStats.totalOrders}
                        icon={ShoppingBag}
                        accent="bg-emerald-500"
                    />
                    <StatCard
                        label="Demandes en attente"
                        value={organizerData.pendingRequests}
                        icon={AlertCircle}
                        accent={
                            organizerData.pendingRequests > 0
                                ? "bg-orange-500"
                                : "bg-zinc-400"
                        }
                    />
                </div>
            )}

            {/* ── ORGANIZER : stats ─────────────────────────────────────── */}
            {(role === "ORGANIZER" || role === "ADMIN") && organizerData && (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard
                        label="Évènements actifs"
                        value={organizerData.events.filter((e) => !e.isDeleted).length}
                        icon={CalendarDays}
                    />
                    <StatCard
                        label="Billets vendus"
                        value={organizerData.totalTicketsSold}
                        icon={Ticket}
                    />
                    <StatCard
                        label="Revenus totaux"
                        value={`${organizerData.revenue.toLocaleString("fr-FR")} FCFA`}
                        icon={TrendingUp}
                        accent="bg-secondary"
                    />
                </div>
            )}

            {/* ── USER : stats ──────────────────────────────────────────── */}
            {role === "USER" && (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard
                        label="Commandes"
                        value={completedOrders}
                        sub={`${recentOrders.length} au total`}
                        icon={ShoppingBag}
                    />
                    <StatCard
                        label="Total dépensé"
                        value={`${totalSpent.toLocaleString("fr-FR")} FCFA`}
                        icon={TrendingUp}
                        accent="bg-secondary"
                    />
                    <StatCard
                        label="Favoris"
                        value={favoritesCount}
                        icon={Heart}
                    />
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                {/* ── Colonne principale ───────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Commandes récentes (USER) */}
                    {role === "USER" && (
                        <section className="bg-card border rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="font-bold text-lg">
                                    Commandes récentes
                                </h2>
                                <Link href="/dashboard/orders">
                                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                        Tout voir <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
                                </Link>
                            </div>

                            {recentOrders.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-xl">
                                    Aucune commande pour le moment.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentOrders.map((order) => (
                                        <div
                                            key={order.id}
                                            className="flex items-center justify-between gap-4 p-3 rounded-xl border hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate">
                                                    {order.event.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground font-mono">
                                                    #{order.reference}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span
                                                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[order.status]}`}
                                                >
                                                    {statusLabel[order.status]}
                                                </span>
                                                <span className="text-sm font-bold">
                                                    {order.totalAmount.toLocaleString("fr-FR")} F
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {/* Ventes récentes (ORGANIZER / ADMIN) */}
                    {(role === "ORGANIZER" || role === "ADMIN") &&
                        organizerData && (
                            <section className="bg-card border rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="font-bold text-lg">
                                        Ventes récentes
                                    </h2>
                                </div>

                                {organizerData.recentSales.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-xl">
                                        Aucune vente pour le moment.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {organizerData.recentSales.map(
                                            (order) => (
                                                <div
                                                    key={order.id}
                                                    className="flex items-center justify-between gap-4 p-3 rounded-xl border hover:bg-muted/30 transition-colors"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm truncate">
                                                            {order.event.title}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {order.user.name ??
                                                                order.user
                                                                    .email}{" "}
                                                            ·{" "}
                                                            {format(
                                                                new Date(
                                                                    order.createdAt,
                                                                ),
                                                                "d MMM yyyy",
                                                                { locale: fr },
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-xs text-muted-foreground">
                                                            {order.items.reduce(
                                                                (s, i) =>
                                                                    s +
                                                                    i.quantity,
                                                                0,
                                                            )}{" "}
                                                            billet(s)
                                                        </span>
                                                        <span className="text-sm font-bold">
                                                            {order.totalAmount.toLocaleString(
                                                                "fr-FR",
                                                            )}{" "}
                                                            F
                                                        </span>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </section>
                        )}

                    {/* Évènements organisés (ORGANIZER / ADMIN) */}
                    {(role === "ORGANIZER" || role === "ADMIN") &&
                        organizerData && (
                            <section className="bg-card border rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="font-bold text-lg">
                                        {role === "ADMIN"
                                            ? "Derniers évènements"
                                            : "Mes évènements"}
                                    </h2>
                                    <Link href="/dashboard/events">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="gap-1 text-xs"
                                        >
                                            Tout voir{" "}
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Button>
                                    </Link>
                                </div>

                                {organizerData.events.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-xl">
                                        Aucun évènement créé.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
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
                                            const revenue =
                                                event.orders.reduce(
                                                    (s, o) =>
                                                        s + o.totalAmount,
                                                    0,
                                                );
                                            return (
                                                <div
                                                    key={event.id}
                                                    className="flex items-center justify-between gap-4 p-3 rounded-xl border hover:bg-muted/30 transition-colors"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-sm truncate">
                                                                {event.title}
                                                            </p>
                                                            {event.isFeatured && (
                                                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400 shrink-0" />
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
                                                    <div className="text-right shrink-0">
                                                        <p className="text-sm font-bold">
                                                            {revenue.toLocaleString(
                                                                "fr-FR",
                                                            )}{" "}
                                                            F
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {ticketsSold} billet(s)
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        )}
                </div>

                {/* ── Colonne latérale ─────────────────────────────────── */}
                <div className="space-y-6">
                    {/* Actions rapides */}
                    <section className="bg-card border rounded-2xl p-6 shadow-sm">
                        <h2 className="font-bold text-lg mb-4">
                            Actions rapides
                        </h2>
                        <div className="space-y-2">
                            <Link href="/dashboard/orders" className="block">
                                <Button variant="outline" className="w-full justify-start gap-2 h-10">
                                    <ShoppingBag className="w-4 h-4" />
                                    Mes commandes
                                </Button>
                            </Link>
                            <Link href="/events" className="block">
                                <Button variant="outline" className="w-full justify-start gap-2 h-10">
                                    <CalendarDays className="w-4 h-4" />
                                    Parcourir les évènements
                                </Button>
                            </Link>

                            {role === "USER" && (
                                <Link href="/dashboard/demande-organisateur" className="block">
                                    <Button className="w-full justify-start gap-2 h-10 bg-secondary/10 text-secondary hover:bg-secondary/20 border border-secondary/30">
                                        <PlusCircle className="w-4 h-4" />
                                        Devenir organisateur
                                    </Button>
                                </Link>
                            )}

                            {(role === "ORGANIZER" || role === "ADMIN") && (
                                <>
                                    <Link href="/dashboard/events/new" className="block">
                                        <Button className="w-full justify-start gap-2 h-10 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                                            <PlusCircle className="w-4 h-4" />
                                            Créer un évènement
                                        </Button>
                                    </Link>
                                    <Link href="/dashboard/events" className="block">
                                        <Button variant="outline" className="w-full justify-start gap-2 h-10">
                                            <CalendarDays className="w-4 h-4" />
                                            Mes évènements
                                        </Button>
                                    </Link>
                                </>
                            )}

                            {role === "ADMIN" && (
                                <>
                                    <Link href="/admin/requests" className="block">
                                        <Button variant="outline" className="w-full justify-start gap-2 h-10 border-orange-300 text-orange-700 hover:bg-orange-50">
                                            <AlertCircle className="w-4 h-4" />
                                            Demandes organisateur
                                            {organizerData?.pendingRequests
                                                ? ` (${organizerData.pendingRequests})`
                                                : ""}
                                        </Button>
                                    </Link>
                                    <Link href="/admin" className="block">
                                        <Button variant="outline" className="w-full justify-start gap-2 h-10">
                                            <Users className="w-4 h-4" />
                                            Panneau admin
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </section>

                    {/* Missions agent confirmées */}
                    {agentEvents.length > 0 && (
                        <section className="bg-card border rounded-2xl p-6 shadow-sm">
                            <h2 className="font-bold text-lg mb-4">
                                Mes missions agent
                            </h2>
                            <div className="space-y-3">
                                {agentEvents.map((a) => (
                                    <Link
                                        key={a.id}
                                        href={`/agent/${a.eventId}/scan`}
                                        className="flex items-center justify-between gap-3 p-3 rounded-xl border hover:bg-muted/30 transition-colors"
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
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Prochains événements (billets achetés) */}
                    {role === "USER" && (() => {
                        const upcoming = recentOrders
                            .filter(
                                (o) =>
                                    o.status === "COMPLETED" &&
                                    new Date(o.event.startDate) > new Date(),
                            )
                            .slice(0, 3);
                        if (upcoming.length === 0) return null;
                        return (
                            <section className="bg-card border rounded-2xl p-6 shadow-sm">
                                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-secondary" />
                                    À venir
                                </h2>
                                <div className="space-y-3">
                                    {upcoming.map((o) => (
                                        <div
                                            key={o.id}
                                            className="p-3 rounded-xl border"
                                        >
                                            <p className="font-semibold text-sm">
                                                {o.event.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {format(
                                                    new Date(o.event.startDate),
                                                    "EEEE d MMMM yyyy",
                                                    { locale: fr },
                                                )}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
