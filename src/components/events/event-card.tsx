import Link from "next/link";
import Image from "next/image";
import {
    IconCalendar,
    IconMapPin,
    IconDeviceTvOld,
    IconStar,
    IconFlame,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { formatEventDateShort, formatEventTime, formatXOF } from "@/lib/format";

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

/** Libellé de prix depuis la liste de billets (déjà triée prix ASC, take:1). */
function getPriceLabel(tickets: { price: number }[]): string {
    if (tickets.length === 0) return "Libre d'accès";
    const price = tickets[0].price;
    if (price === 0) return "Gratuit";
    return `Dès ${formatXOF(price)}`;
}

/**
 * Signal de rareté affiché à la place des compteurs sociaux.
 *
 * `remainingStock` est optionnel : les sections de l'accueil ne le calculent
 * pas (une agrégation de stock par carte y coûterait plus qu'elle ne rapporte).
 */
function getScarcity(
    remainingStock: number | null | undefined,
): { label: string; tone: string } | null {
    if (remainingStock === null || remainingStock === undefined) return null;
    if (remainingStock <= 0)
        return { label: "Complet", tone: "text-muted-foreground" };
    if (remainingStock <= 10)
        return {
            label: `Plus que ${remainingStock} place${remainingStock > 1 ? "s" : ""}`,
            tone: "text-destructive",
        };
    if (remainingStock <= 30)
        return { label: "Bientôt complet", tone: "text-yellow-600 dark:text-yellow-500" };
    return null;
}

// ─────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────

interface EventCardProps {
    event: EventForCard;
    view: "grid" | "list";
    /** Places restantes, tous billets confondus. Omis = information non chargée. */
    remainingStock?: number | null;
}

export default function EventCard({
    event,
    view,
    remainingStock,
}: EventCardProps) {
    const shared = {
        event,
        priceLabel: getPriceLabel(event.tickets),
        dateLabel: formatEventDateShort(event.startDate),
        timeLabel: formatEventTime(event.startDate),
        isOnline: event.eventType === "ONLINE",
        scarcity: getScarcity(remainingStock),
    };

    return view === "list" ? <ListItem {...shared} /> : <GridCard {...shared} />;
}

type ViewProps = {
    event: EventForCard;
    priceLabel: string;
    dateLabel: string;
    timeLabel: string;
    isOnline: boolean;
    scarcity: { label: string; tone: string } | null;
};

// ─────────────────────────────────────────────
// Vue grille
// ─────────────────────────────────────────────

function GridCard({
    event,
    priceLabel,
    dateLabel,
    timeLabel,
    isOnline,
    scarcity,
}: ViewProps) {
    const isSoldOut = scarcity?.label === "Complet";

    return (
        <Link href={`/events/${event.slug}`} className="group">
            <div className="h-full flex flex-col overflow-hidden rounded-3xl border-2 border-transparent bg-card hover:border-secondary/50 hover:shadow-xl transition-all duration-300">
                {/* ── Image ───────────────────────────────────────────── */}
                <div className="relative h-48 shrink-0 overflow-hidden rounded-t-3xl bg-muted">
                    {event.imageUrl ? (
                        <Image
                            src={event.imageUrl}
                            alt=""
                            fill
                            sizes="(min-width: 1280px) 22rem, (min-width: 768px) 45vw, 100vw"
                            className={cn(
                                "object-cover group-hover:scale-105 transition-transform duration-500 motion-reduce:transition-none motion-reduce:group-hover:scale-100",
                                isSoldOut && "grayscale opacity-70",
                            )}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <IconCalendar
                                className="w-12 h-12 text-muted-foreground/40"
                                aria-hidden="true"
                            />
                        </div>
                    )}

                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

                    {/* Badges haut gauche */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        {event.isFeatured && (
                            <span className="flex items-center gap-1 bg-yellow-400/90 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-sm shadow">
                                <IconStar
                                    className="w-3 h-3 fill-yellow-900"
                                    aria-hidden="true"
                                />
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

                    {/* Rareté — haut droite, là où l'œil termine sa lecture du visuel */}
                    {scarcity && (
                        <span
                            className={cn(
                                "absolute top-3 right-3 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-bold shadow backdrop-blur-sm",
                                scarcity.tone,
                            )}
                        >
                            {!isSoldOut && (
                                <IconFlame
                                    className="w-3 h-3"
                                    aria-hidden="true"
                                />
                            )}
                            {scarcity.label}
                        </span>
                    )}
                </div>

                {/* ── Corps ───────────────────────────────────────────── */}
                <div className="flex flex-col flex-1 p-5 space-y-3">
                    {event.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {event.categories
                                .slice(0, 2)
                                .map(({ category }) => (
                                    <span
                                        key={category.slug}
                                        className="text-xs bg-primary text-primary-foreground font-medium px-2.5 py-0.5 rounded-full"
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

                    <h3 className="font-afo text-4xl leading-tight line-clamp-2 group-hover:text-secondary transition-colors flex-1">
                        {event.title}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <IconCalendar
                            className="w-3.5 h-3.5 shrink-0 text-secondary"
                            aria-hidden="true"
                        />
                        <span>
                            {dateLabel} à {timeLabel}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {isOnline ? (
                            <>
                                <IconDeviceTvOld
                                    className="w-3.5 h-3.5 shrink-0 text-blue-500"
                                    aria-hidden="true"
                                />
                                <span className="text-blue-500 font-medium">
                                    Évènement en ligne
                                </span>
                            </>
                        ) : (
                            <>
                                <IconMapPin
                                    className="w-3.5 h-3.5 shrink-0"
                                    aria-hidden="true"
                                />
                                <span className="truncate">
                                    {event.location ?? "Lieu à confirmer"}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Prix + organisateur — ce qui décide de l'achat */}
                    <div className="flex items-center justify-between pt-3 border-t mt-auto gap-2">
                        <span className="font-bold text-lg text-secondary leading-none shrink-0">
                            {priceLabel}
                        </span>
                        {event.organizer.name && (
                            <span className="text-xs text-muted-foreground truncate">
                                par {event.organizer.name}
                            </span>
                        )}
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
    scarcity,
}: ViewProps) {
    return (
        <Link href={`/events/${event.slug}`} className="group">
            <div className="flex items-center gap-4 rounded-2xl border bg-card p-3 md:p-4 hover:border-secondary/50 hover:shadow-md transition-all duration-200">
                {/* ── Vignette ────────────────────────────────────────── */}
                <div className="relative w-20 h-20 sm:w-28 sm:h-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {event.imageUrl ? (
                        <Image
                            src={event.imageUrl}
                            alt=""
                            fill
                            sizes="(min-width: 640px) 7rem, 5rem"
                            className="object-cover group-hover:scale-105 transition-transform duration-300 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <IconCalendar
                                className="w-7 h-7 text-muted-foreground/40"
                                aria-hidden="true"
                            />
                        </div>
                    )}
                    {event.isFeatured && (
                        <div className="absolute top-1.5 left-1.5">
                            <IconStar
                                className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 drop-shadow"
                                aria-hidden="true"
                            />
                        </div>
                    )}
                </div>

                {/* ── Infos ───────────────────────────────────────────── */}
                <div className="flex-1 min-w-0 space-y-1.5">
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
                                className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium"
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

                    <h3 className="font-afo text-3xl leading-tight line-clamp-1 group-hover:text-secondary transition-colors">
                        {event.title}
                    </h3>

                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <IconCalendar
                                className="w-3 h-3 shrink-0"
                                aria-hidden="true"
                            />
                            {dateLabel} à {timeLabel}
                        </span>
                        {!isOnline && event.location && (
                            <span className="flex items-center gap-1 truncate max-w-45">
                                <IconMapPin
                                    className="w-3 h-3 shrink-0"
                                    aria-hidden="true"
                                />
                                {event.location}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Prix + rareté ─────────────────────────────────────── */}
                <div className="shrink-0 text-right hidden sm:flex flex-col items-end gap-1.5">
                    <span className="font-bold text-secondary text-sm whitespace-nowrap">
                        {priceLabel}
                    </span>
                    {scarcity && (
                        <span
                            className={cn(
                                "text-xs font-semibold whitespace-nowrap",
                                scarcity.tone,
                            )}
                        >
                            {scarcity.label}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
