import Link from "next/link";
import Image from "next/image";
import {
    Calendar,
    MapPin,
    MonitorPlay,
    Heart,
    Star,
    Bookmark,
    Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Type partagé (doit correspondre à la query Prisma de la page)
// ─────────────────────────────────────────────

export type EventForCard = {
    id: string;
    slug: string;
    title: string;
    description: string;
    imageUrl: string | null;
    eventType: string;
    location: string | null;
    onlineUrl: string | null;
    startDate: Date;
    endDate: Date;
    isFeatured: boolean;
    organizer: { name: string | null };
    tickets: { price: number }[];
    categories: { category: { name: string; slug: string } }[];
    shareCount: number;
    _count: { likes: number; favorites: number };
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatDate(date: Date) {
    return new Date(date).toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "Africa/Porto-Novo",
    });
}

function formatTime(date: Date) {
    return new Date(date).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Porto-Novo",
    });
}

/** Retourne le label de prix depuis la liste de billets (déjà triée prix ASC, take:1). */
function getPriceLabel(tickets: { price: number }[]): string {
    if (tickets.length === 0) return "Libre d'accès";
    const price = tickets[0].price;
    if (price === 0) return "Gratuit";
    return `Dès ${price.toLocaleString("fr-FR")} FCFA`;
}

// ─────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────

interface EventCardProps {
    event: EventForCard;
    view: "grid" | "list";
}

export default function EventCard({ event, view }: EventCardProps) {
    const priceLabel = getPriceLabel(event.tickets);
    const dateLabel = formatDate(event.startDate);
    const timeLabel = formatTime(event.startDate);
    const isOnline = event.eventType === "ONLINE";

    if (view === "list") {
        return (
            <ListItem
                event={event}
                priceLabel={priceLabel}
                dateLabel={dateLabel}
                timeLabel={timeLabel}
                isOnline={isOnline}
            />
        );
    }

    return (
        <GridCard
            event={event}
            priceLabel={priceLabel}
            dateLabel={dateLabel}
            timeLabel={timeLabel}
            isOnline={isOnline}
        />
    );
}

// ─────────────────────────────────────────────
// Vue grille
// ─────────────────────────────────────────────

function GridCard({
    event,
    priceLabel,
    dateLabel,
    timeLabel,
    isOnline,
}: {
    event: EventForCard;
    priceLabel: string;
    dateLabel: string;
    timeLabel: string;
    isOnline: boolean;
}) {
    return (
        <Link href={`/events/${event.slug}`} className="group">
            <div className="h-full flex flex-col overflow-hidden rounded-3xl border-2 border-transparent bg-card hover:border-secondary/50 hover:shadow-xl transition-all duration-300">
                {/* ── Image ───────────────────────────────────────────── */}
                <div className="relative h-48 shrink-0 overflow-hidden rounded-t-3xl bg-muted">
                    {event.imageUrl ? (
                        <Image
                            src={event.imageUrl}
                            alt={event.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Calendar className="w-12 h-12 text-muted-foreground/40" />
                        </div>
                    )}

                    {/* Dégradé bas */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

                    {/* Badges haut gauche */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        {event.isFeatured && (
                            <span className="flex items-center gap-1 bg-yellow-400/90 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-sm shadow">
                                <Star className="w-3 h-3 fill-yellow-900" />
                                Vedette
                            </span>
                        )}
                        <span
                            className={cn(
                                "text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-sm shadow",
                                isOnline
                                    ? "bg-blue-500/90 text-white"
                                    : "bg-emerald-500/90 text-white",
                            )}
                        >
                            {isOnline ? "En ligne" : "Présentiel"}
                        </span>
                    </div>
                </div>

                {/* ── Corps ───────────────────────────────────────────── */}
                <div className="flex flex-col flex-1 p-5 space-y-3">
                    {/* Catégories (max 2 + overflow) */}
                    {event.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {event.categories
                                .slice(0, 2)
                                .map(({ category }) => (
                                    <span
                                        key={category.slug}
                                        className="text-xs bg-primary text-secondary font-medium px-2.5 py-0.5 rounded-full"
                                    >
                                        {category.name}
                                    </span>
                                ))}
                            {event.categories.length > 2 && (
                                <span className="text-xs text-muted-foreground self-center">
                                    +{event.categories.length - 2}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Titre */}
                    <h3 className="font-afo text-4xl leading-tight line-clamp-2 group-hover:text-secondary transition-colors flex-1">
                        {event.title}
                    </h3>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 shrink-0 text-secondary" />
                        <span>
                            {dateLabel} à {timeLabel}
                        </span>
                    </div>

                    {/* Lieu / En ligne */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {isOnline ? (
                            <>
                                <MonitorPlay className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                                <span className="text-blue-500 font-medium">
                                    Évènement en ligne
                                </span>
                            </>
                        ) : (
                            <>
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">
                                    {event.location ?? "Lieu à confirmer"}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Prix + Stats */}
                    <div className="flex items-center justify-between pt-3 border-t mt-auto gap-2">
                        <span className="font-bold text-lg text-secondary leading-none shrink-0">
                            {priceLabel}
                        </span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Heart className="w-3.5 h-3.5" />
                                {event._count.likes.toLocaleString("fr-FR")}
                            </span>
                            <span className="flex items-center gap-1">
                                <Bookmark className="w-3.5 h-3.5" />
                                {event._count.favorites.toLocaleString("fr-FR")}
                            </span>
                            <span className="flex items-center gap-1">
                                <Share2 className="w-3.5 h-3.5" />
                                {event.shareCount.toLocaleString("fr-FR")}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

// ─────────────────────────────────────────────
// Vue liste
// ─────────────────────────────────────────────

function ListItem({
    event,
    priceLabel,
    dateLabel,
    timeLabel,
    isOnline,
}: {
    event: EventForCard;
    priceLabel: string;
    dateLabel: string;
    timeLabel: string;
    isOnline: boolean;
}) {
    return (
        <Link href={`/events/${event.slug}`} className="group">
            <div className="flex items-center gap-4 rounded-2xl border bg-card p-3 md:p-4 hover:border-secondary/50 hover:shadow-md transition-all duration-200">
                {/* ── Vignette ────────────────────────────────────────── */}
                <div className="relative w-20 h-20 sm:w-28 sm:h-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {event.imageUrl ? (
                        <Image
                            src={event.imageUrl}
                            alt={event.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Calendar className="w-7 h-7 text-muted-foreground/40" />
                        </div>
                    )}
                    {event.isFeatured && (
                        <div className="absolute top-1.5 left-1.5">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 drop-shadow" />
                        </div>
                    )}
                </div>

                {/* ── Infos ───────────────────────────────────────────── */}
                <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span
                            className={cn(
                                "text-xs font-semibold px-2 py-0.5 rounded-full",
                                isOnline
                                    ? "bg-blue-500/10 text-blue-500"
                                    : "bg-emerald-500/10 text-emerald-600",
                            )}
                        >
                            {isOnline ? "En ligne" : "Présentiel"}
                        </span>
                        {event.categories.slice(0, 2).map(({ category }) => (
                            <span
                                key={category.slug}
                                className="text-xs bg-primary text-secondary px-2 py-0.5 rounded-full font-medium"
                            >
                                {category.name}
                            </span>
                        ))}
                        {event.categories.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                                +{event.categories.length - 2}
                            </span>
                        )}
                    </div>

                    {/* Titre */}
                    <h3 className="font-afo text-3xl leading-tight line-clamp-1 group-hover:text-secondary transition-colors">
                        {event.title}
                    </h3>

                    {/* Date + Lieu */}
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 shrink-0" />
                            {dateLabel} à {timeLabel}
                        </span>
                        {!isOnline && event.location && (
                            <span className="flex items-center gap-1 truncate max-w-45">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {event.location}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Prix + Stats ──────────────────────────────────────── */}
                <div className="shrink-0 text-right hidden sm:flex flex-col items-end gap-1.5">
                    <span className="font-bold text-secondary text-sm whitespace-nowrap">
                        {priceLabel}
                    </span>
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {event._count.likes.toLocaleString("fr-FR")}
                        </span>
                        <span className="flex items-center gap-1">
                            <Bookmark className="w-3 h-3" />
                            {event._count.favorites.toLocaleString("fr-FR")}
                        </span>
                        <span className="flex items-center gap-1">
                            <Share2 className="w-3 h-3" />
                            {event.shareCount.toLocaleString("fr-FR")}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
