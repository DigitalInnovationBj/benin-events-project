import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventsFilters from "./events-filters";
import EventCard, { type EventForCard } from "./event-card";
import Image from "next/image";
import Header from "@/components/sections/Header";
import Footer from "@/components/sections/Footer";

// ─────────────────────────────────────────────
// Metadata statique
// ─────────────────────────────────────────────

export const metadata: Metadata = {
    title: "Tous les évènements | Benin Events",
    description:
        "Découvrez tous les évènements à venir au Bénin. Concerts, festivals, conférences et bien plus.",
};

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type SearchParams = Promise<{
    q?: string;
    category?: string;
    type?: string;
    sort?: string;
    view?: string;
}>;

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
    const sort = typeof sp.sort === "string" ? sp.sort : "date_asc";
    const view = typeof sp.view === "string" ? sp.view : "grid";

    // ── Clause WHERE dynamique ─────────────────────────────────────────────
    const where: Prisma.EventWhereInput = {
        // Uniquement les événements dont la date de début est dans le futur
        startDate: { gte: new Date() },
        isDeleted: false,
    };

    // Recherche full-text sur le titre et la description
    if (q) {
        where.OR = [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
        ];
    }

    // Filtre par catégorie (slug)
    if (category) {
        where.categories = {
            some: { category: { slug: category } },
        };
    }

    // Filtre par type d'évènement
    if (type === "IN_PERSON" || type === "ONLINE") {
        where.eventType = type;
    }

    // ── Clause ORDER BY ────────────────────────────────────────────────────
    const orderBy: Prisma.EventOrderByWithRelationInput =
        sort === "popular"
            ? { likes: { _count: "desc" } } // Tri par nombre de likes
            : sort === "recent"
              ? { createdAt: "desc" } // Tri par date d'ajout
              : sort === "date_desc"
                ? { startDate: "desc" } // Date la plus lointaine en premier
                : { startDate: "asc" }; // Par défaut : date la plus proche

    // ── Fetch en parallèle ─────────────────────────────────────────────────
    const [events, allCategories] = await Promise.all([
        prisma.event.findMany({
            where,
            orderBy,
            include: {
                // Uniquement les champs nécessaires pour la carte
                organizer: {
                    select: { name: true },
                },
                // Billet le moins cher (prix affiché sur la carte)
                tickets: {
                    select: { price: true },
                    orderBy: { price: "asc" },
                    take: 1,
                },
                // Catégories (max 2 affichées sur la carte)
                categories: {
                    include: {
                        category: {
                            select: { name: true, slug: true },
                        },
                    },
                },
                // Compteur de likes
                _count: {
                    select: { likes: true, favorites: true },
                },
            },
        }),
        prisma.category.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true, slug: true },
        }),
    ]);

    const hasFilters = !!(
        q ||
        category ||
        type ||
        (sort && sort !== "date_asc")
    );
    const hasEvents = events.length > 0;

    // ── Label du compteur ──────────────────────────────────────────────────
    const countLabel = (() => {
        if (!hasEvents) {
            return hasFilters
                ? "Aucun résultat pour ces filtres"
                : "Aucun évènement pour le moment";
        }
        const n = events.length;
        const base = `${n} évènement${n > 1 ? "s" : ""}`;
        if (hasFilters) return `${base} trouvé${n > 1 ? "s" : ""}`;
        return `${base} à venir`;
    })();

    return (
        <main className="min-h-screen bg-background">
            <Header />
            {/* ══════════════════════════════════════════════════════════════
                En-tête hero
            ══════════════════════════════════════════════════════════════ */}
            <div className="relative border-b overflow-hidden h-52 md:h-72">
                {/* Image de fond */}
                <Image
                    src="/hero.jpg"
                    alt="Évènements au Bénin"
                    fill
                    priority
                    className="object-cover object-center"
                    sizes="100vw"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-linear-to-b from-black/55 via-black/50 to-black/75" />

                {/* Contenu */}
                <div className="relative z-10 h-full flex flex-col justify-end max-w-6xl mx-auto px-6 pb-6 md:px-12 md:pb-8">
                    <h1 className="text-5xl md:text-6xl font-afo text-white mb-1">
                        Évènements
                    </h1>
                    <p className="text-white/65 text-sm">{countLabel}</p>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                Barre de filtres
            ══════════════════════════════════════════════════════════════ */}
            <div className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-6 py-3 md:px-12">
                    <EventsFilters
                        categories={allCategories}
                        currentSearch={q}
                        currentCategory={category}
                        currentType={type}
                        currentSort={sort}
                        currentView={view}
                        hasFilters={hasFilters}
                    />
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                Contenu
            ══════════════════════════════════════════════════════════════ */}
            <div className="max-w-6xl mx-auto px-6 py-8 pb-20 md:px-12">
                {hasEvents ? (
                    view === "list" ? (
                        /* ── Vue liste ─────────────────────────────────── */
                        <div className="flex flex-col gap-3">
                            {events.map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event as unknown as EventForCard}
                                    view="list"
                                />
                            ))}
                        </div>
                    ) : (
                        /* ── Vue grille ────────────────────────────────── */
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {events.map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event as unknown as EventForCard}
                                    view="grid"
                                />
                            ))}
                        </div>
                    )
                ) : (
                    /* ── État vide ─────────────────────────────────────── */
                    <div className="text-center py-28">
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                        <h3 className="text-2xl font-bold mb-2">
                            {hasFilters ? "Aucun résultat" : "Aucun évènement"}
                        </h3>
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

            <Footer />
        </main>
    );
}
