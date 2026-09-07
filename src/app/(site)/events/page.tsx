import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { IconCalendarOff } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import EventsFilters from "./events-filters";
import EventsPagination from "./events-pagination";
import EventCard, { type EventForCard } from "@/components/events/event-card";
import Image from "next/image";
import { CITIES, isCitySlug } from "@/lib/cities";
import { formatNumber } from "@/lib/format";
import { normalizeSearch } from "@/lib/search";
import { getRemainingStock } from "@/lib/stock";

export const metadata: Metadata = {
    // Le template du layout racine ajoute déjà « | Benin Events ».
    title: "Tous les évènements",
    description:
        "Découvrez tous les évènements à venir au Bénin. Concerts, festivals, conférences et bien plus.",
};

/** Évènements affichés par page. */
const PAGE_SIZE = 24;

type SearchParams = Promise<{
    q?: string;
    category?: string;
    type?: string;
    city?: string;
    date?: string;
    price?: string;
    sort?: string;
    view?: string;
    page?: string;
}>;

// ─────────────────────────────────────────────
// Filtre de date rapide
// ─────────────────────────────────────────────

/**
 * Traduit `?date=` en bornes sur `startDate`.
 *
 * Les bornes sont calculées sur l'heure locale du serveur ; c'est suffisant
 * pour un filtre indicatif « aujourd'hui / ce week-end / ce mois ».
 */
function dateRangeFilter(
    key: string,
    now: Date,
): { gte: Date; lte?: Date } | null {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    if (key === "today") {
        const endOfToday = new Date(startOfToday);
        endOfToday.setHours(23, 59, 59, 999);
        // On ne remonte jamais dans le passé : borne basse = maintenant.
        return { gte: now, lte: endOfToday };
    }

    if (key === "weekend") {
        // Samedi (6) et dimanche (0) de la semaine en cours.
        const day = startOfToday.getDay();
        const daysUntilSaturday = (6 - day + 7) % 7;
        const saturday = new Date(startOfToday);
        saturday.setDate(saturday.getDate() + daysUntilSaturday);
        const endOfSunday = new Date(saturday);
        endOfSunday.setDate(endOfSunday.getDate() + 1);
        endOfSunday.setHours(23, 59, 59, 999);
        return { gte: saturday > now ? saturday : now, lte: endOfSunday };
    }

    if (key === "month") {
        const endOfMonth = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59,
            999,
        );
        return { gte: now, lte: endOfMonth };
    }

    return null;
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function EventsPage({
    searchParams,
}: {
    searchParams: SearchParams;
}) {
    const sp = await searchParams;

    // ── Lire les paramètres de l'URL ───────────────────────────────────────
    const q = typeof sp.q === "string" ? sp.q.trim() : "";
    const category = typeof sp.category === "string" ? sp.category : "";
    const type = typeof sp.type === "string" ? sp.type : "";
    const city = typeof sp.city === "string" && isCitySlug(sp.city) ? sp.city : "";
    const date = typeof sp.date === "string" ? sp.date : "";
    const price = typeof sp.price === "string" ? sp.price : "";
    const sort = typeof sp.sort === "string" ? sp.sort : "date_asc";
    const view = typeof sp.view === "string" ? sp.view : "grid";
    const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

    const now = new Date();

    // ── Clause WHERE dynamique ─────────────────────────────────────────────
    const where: Prisma.EventWhereInput = {
        startDate: { gte: now },
        isDeleted: false,
        isPublished: true,
        isCancelled: false,
    };

    if (q) {
        // Chaque mot doit être présent, dans n'importe quel ordre : « concert
        // cotonou » trouve « Concert live à Cotonou ». La comparaison porte sur
        // `searchText`, déjà en minuscules sans accents.
        const terms = normalizeSearch(q).split(" ").filter(Boolean);
        where.AND = terms.map((term) => ({
            searchText: { contains: term },
        }));
    }

    if (category) {
        where.categories = { some: { category: { slug: category } } };
    }

    if (type === "IN_PERSON" || type === "ONLINE") {
        where.eventType = type;
    }

    if (city) {
        where.city = city;
    }

    const range = date ? dateRangeFilter(date, now) : null;
    if (range) {
        where.startDate = range;
    }

    // Gratuit = au moins un billet à 0. Payant = au moins un billet > 0.
    if (price === "free") {
        where.tickets = { some: { price: 0 } };
    } else if (price === "paid") {
        where.tickets = { some: { price: { gt: 0 } } };
    }

    // ── Clause ORDER BY ────────────────────────────────────────────────────
    const orderBy: Prisma.EventOrderByWithRelationInput =
        sort === "popular"
            ? { likes: { _count: "desc" } }
            : sort === "recent"
              ? { createdAt: "desc" }
              : sort === "date_desc"
                ? { startDate: "desc" }
                : { startDate: "asc" };

    // ── Fetch en parallèle ─────────────────────────────────────────────────
    const [events, totalCount, allCategories] = await Promise.all([
        prisma.event.findMany({
            where,
            orderBy,
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
            include: {
                organizer: { select: { name: true } },
                // Tous les billets : le premier donne le prix « dès … », et
                // l'ensemble sert à calculer les places restantes.
                tickets: {
                    select: { id: true, price: true, totalStock: true },
                    orderBy: { price: "asc" },
                },
                categories: {
                    include: {
                        category: { select: { name: true, slug: true } },
                    },
                },
                _count: { select: { likes: true, favorites: true } },
            },
        }),
        prisma.event.count({ where }),
        prisma.category.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true, slug: true },
        }),
    ]);

    // ── Places restantes par évènement ─────────────────────────────────────
    // Une seule agrégation pour toute la page. Un évènement comportant au
    // moins un billet à stock illimité est considéré comme illimité (null).
    const remainingByTicket = await getRemainingStock(
        events.flatMap((e) => e.tickets.map((t) => t.id)),
    );

    const remainingByEvent = new Map<string, number | null>(
        events.map((event) => {
            if (event.tickets.length === 0) return [event.id, null];
            let total = 0;
            for (const ticket of event.tickets) {
                const left = remainingByTicket.get(ticket.id);
                if (left === null || left === undefined) return [event.id, null];
                total += left;
            }
            return [event.id, total];
        }),
    );

    const hasFilters = !!(
        q ||
        category ||
        type ||
        city ||
        date ||
        price ||
        (sort && sort !== "date_asc")
    );
    const activeCount = [
        category,
        type,
        city,
        date,
        price,
        sort !== "date_asc" ? sort : "",
    ].filter(Boolean).length;
    const hasEvents = events.length > 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    // ── Label du compteur ──────────────────────────────────────────────────
    const countLabel = (() => {
        if (totalCount === 0) {
            return hasFilters
                ? "Aucun résultat pour ces filtres"
                : "Aucun évènement pour le moment";
        }
        const base = `${formatNumber(totalCount)} évènement${totalCount > 1 ? "s" : ""}`;
        const suffix = hasFilters
            ? ` trouvé${totalCount > 1 ? "s" : ""}`
            : " à venir";
        const pageInfo = totalPages > 1 ? ` — page ${page} sur ${totalPages}` : "";
        return `${base}${suffix}${pageInfo}`;
    })();

    return (
        <div className="bg-background">
            {/* ══════════════════════════════════════════════════════════════
                En-tête hero
            ══════════════════════════════════════════════════════════════ */}
            <div className="relative border-b overflow-hidden h-52 md:h-72">
                <Image
                    src="/hero.jpg"
                    alt=""
                    fill
                    priority
                    className="object-cover object-center"
                    sizes="100vw"
                />
                <div className="absolute inset-0 bg-linear-to-b from-black/55 via-black/50 to-black/75" />

                <div className="relative z-10 h-full flex flex-col justify-end max-w-6xl mx-auto px-6 pb-6 md:px-12 md:pb-8">
                    <h1 className="text-5xl md:text-6xl font-afo text-white mb-1">
                        Évènements
                    </h1>
                    {/* Annonce le nouveau décompte aux lecteurs d'écran après filtrage */}
                    <p className="text-white/65 text-sm" aria-live="polite">
                        {countLabel}
                    </p>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                Filtres + résultats
                Mobile/tablette : barre compacte collante + drawer.
                Desktop : colonne de filtres à gauche, résultats à droite.
            ══════════════════════════════════════════════════════════════ */}
            <div className="max-w-6xl mx-auto px-6 md:px-12 pb-20">
                <div className="lg:grid lg:grid-cols-[17rem_1fr] lg:gap-8 lg:pt-8">
                    {/* Rendu une seule fois : le composant bascule lui-même
                        entre barre + drawer (mobile) et panneau latéral
                        (desktop). Le dupliquer afficherait deux barres. */}
                    <EventsFilters
                        categories={allCategories}
                        cities={[...CITIES]}
                        currentSearch={q}
                        currentCategory={category}
                        currentType={type}
                        currentCity={city}
                        currentDate={date}
                        currentPrice={price}
                        currentSort={sort}
                        currentView={view}
                        hasFilters={hasFilters}
                        activeCount={activeCount}
                    />

                    {/* ── Résultats ─────────────────────────────────────── */}
                    <div className="pt-8 lg:pt-0 lg:min-w-0">
                        {hasEvents ? (
                            <>
                                {view === "list" ? (
                                    <div className="flex flex-col gap-3">
                                        {events.map((event) => (
                                            <EventCard
                                                key={event.id}
                                                event={event as unknown as EventForCard}
                                                view="list"
                                                remainingStock={remainingByEvent.get(event.id)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                                        {events.map((event) => (
                                            <EventCard
                                                key={event.id}
                                                event={event as unknown as EventForCard}
                                                view="grid"
                                                remainingStock={remainingByEvent.get(event.id)}
                                            />
                                        ))}
                                    </div>
                                )}

                                <EventsPagination
                                    currentPage={page}
                                    totalPages={totalPages}
                                />
                            </>
                        ) : (
                            <div className="text-center py-24">
                                <IconCalendarOff
                                    className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30"
                                    aria-hidden="true"
                                />
                                <h2 className="text-2xl font-bold mb-2">
                                    {hasFilters ? "Aucun résultat" : "Aucun évènement"}
                                </h2>
                                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                                    {hasFilters
                                        ? "Aucun évènement ne correspond à vos critères. Essayez de modifier vos filtres."
                                        : "Restez à l'affût ! De nouveaux évènements seront bientôt disponibles."}
                                </p>
                                {hasFilters ? (
                                    <Button asChild variant="outline">
                                        <Link href="/events">
                                            Réinitialiser les filtres
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button asChild>
                                        <Link href="/">Retour à l&apos;accueil</Link>
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
