"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    IconSearch,
    IconLayoutGrid,
    IconList,
    IconX,
    IconMapPin,
    IconDeviceTvOld,
    IconCalendar,
    IconTrendingUp,
    IconClock,
    IconLoader2,
} from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Category = { id: string; name: string; slug: string };
type City = { slug: string; name: string };

interface EventsFiltersProps {
    categories: Category[];
    cities: City[];
    currentSearch: string;
    currentCategory: string;
    currentType: string;
    currentCity: string;
    currentDate: string;
    currentPrice: string;
    currentSort: string;
    currentView: string;
    hasFilters: boolean;
}

export default function EventsFilters({
    categories,
    cities,
    currentSearch,
    currentCategory,
    currentType,
    currentCity,
    currentDate,
    currentPrice,
    currentSort,
    currentView,
    hasFilters,
}: EventsFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    // `isPending` reste vrai tant que le serveur n'a pas renvoyé la nouvelle
    // liste : la barre affiche un indicateur au lieu de paraître figée.
    const [isPending, startTransition] = useTransition();

    const [search, setSearch] = useState(currentSearch);

    // ── Sync input quand l'URL change (navigation arrière/avant) ────────────
    // Ajustement d'état pendant le rendu (pattern React officiel) plutôt
    // qu'un setState dans un effet, qui déclencherait un rendu en cascade.
    const [prevSearch, setPrevSearch] = useState(currentSearch);
    if (prevSearch !== currentSearch) {
        setPrevSearch(currentSearch);
        setSearch(currentSearch);
    }

    // ── Construit l'URL avec les params mis à jour ──────────────────────────
    const buildUrl = useCallback(
        (updates: Record<string, string | null>) => {
            const base: Record<string, string> = {};

            if (currentSearch) base.q = currentSearch;
            if (currentCategory) base.category = currentCategory;
            if (currentType) base.type = currentType;
            if (currentCity) base.city = currentCity;
            if (currentDate) base.date = currentDate;
            if (currentPrice) base.price = currentPrice;
            if (currentSort && currentSort !== "date_asc")
                base.sort = currentSort;
            if (currentView && currentView !== "grid") base.view = currentView;

            for (const [key, value] of Object.entries(updates)) {
                if (value === null || value === "" || value === "all") {
                    delete base[key];
                } else {
                    base[key] = value;
                }
            }

            const params = new URLSearchParams(base);
            const qs = params.toString();
            return `${pathname}${qs ? `?${qs}` : ""}`;
        },
        [
            pathname,
            currentSearch,
            currentCategory,
            currentType,
            currentCity,
            currentDate,
            currentPrice,
            currentSort,
            currentView,
        ],
    );

    const navigate = useCallback(
        (updates: Record<string, string | null>) => {
            // Tout changement de filtre ramène en page 1 : rester en page 5
            // d'un jeu de résultats qui n'en a plus que 2 donnerait une page vide.
            startTransition(() => {
                router.push(buildUrl({ ...updates, page: null }), {
                    scroll: false,
                });
            });
        },
        [router, buildUrl],
    );

    // ── Recherche avec debounce (400ms) ────────────────────────────────────
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search.trim() !== currentSearch) {
                navigate({ q: search.trim() || null });
            }
        }, 400);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const selectClass = "h-9 shrink-0";

    return (
        <div
            className={cn(
                "flex flex-wrap items-center gap-2 md:gap-3 transition-opacity",
                isPending && "opacity-60",
            )}
        >
            {/* ── Recherche ──────────────────────────────────────────────── */}
            <div className="relative flex-1 min-w-45 max-w-xs">
                {isPending ? (
                    <IconLoader2
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin pointer-events-none"
                        aria-hidden="true"
                    />
                ) : (
                    <IconSearch
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                        aria-hidden="true"
                    />
                )}
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un évènement…"
                    aria-label="Rechercher un évènement"
                    className="pl-9 pr-8 h-9"
                />
                {search && (
                    <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Effacer la recherche"
                    >
                        <IconX className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                )}
            </div>

            {/* ── Catégorie ──────────────────────────────────────────────── */}
            <Select
                value={currentCategory || "all"}
                onValueChange={(v) => navigate({ category: v })}
            >
                <SelectTrigger className={cn(selectClass, "w-40")} aria-label="Catégorie">
                    <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.slug}>
                            {cat.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* ── Ville ──────────────────────────────────────────────────── */}
            <Select
                value={currentCity || "all"}
                onValueChange={(v) => navigate({ city: v })}
            >
                <SelectTrigger className={cn(selectClass, "w-36")} aria-label="Ville">
                    <SelectValue placeholder="Ville" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Toutes les villes</SelectItem>
                    {cities.map((city) => (
                        <SelectItem key={city.slug} value={city.slug}>
                            {city.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* ── Quand ──────────────────────────────────────────────────── */}
            <Select
                value={currentDate || "all"}
                onValueChange={(v) => navigate({ date: v })}
            >
                <SelectTrigger className={cn(selectClass, "w-36")} aria-label="Quand">
                    <SelectValue placeholder="Quand" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">N&apos;importe quand</SelectItem>
                    <SelectItem value="today">Aujourd&apos;hui</SelectItem>
                    <SelectItem value="weekend">Ce week-end</SelectItem>
                    <SelectItem value="month">Ce mois-ci</SelectItem>
                </SelectContent>
            </Select>

            {/* ── Prix ───────────────────────────────────────────────────── */}
            <Select
                value={currentPrice || "all"}
                onValueChange={(v) => navigate({ price: v })}
            >
                <SelectTrigger className={cn(selectClass, "w-32")} aria-label="Prix">
                    <SelectValue placeholder="Prix" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tous les prix</SelectItem>
                    <SelectItem value="free">Gratuit</SelectItem>
                    <SelectItem value="paid">Payant</SelectItem>
                </SelectContent>
            </Select>

            {/* ── Type d'évènement ───────────────────────────────────────── */}
            <Select
                value={currentType || "all"}
                onValueChange={(v) => navigate({ type: v })}
            >
                <SelectTrigger className={cn(selectClass, "w-36")} aria-label="Type d'évènement">
                    <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="IN_PERSON">
                        <span className="flex items-center gap-2">
                            <IconMapPin className="w-3.5 h-3.5 text-emerald-500" />
                            Présentiel
                        </span>
                    </SelectItem>
                    <SelectItem value="ONLINE">
                        <span className="flex items-center gap-2">
                            <IconDeviceTvOld className="w-3.5 h-3.5 text-blue-500" />
                            En ligne
                        </span>
                    </SelectItem>
                </SelectContent>
            </Select>

            {/* ── Tri ────────────────────────────────────────────────────── */}
            <Select
                value={currentSort || "date_asc"}
                onValueChange={(v) =>
                    navigate({ sort: v === "date_asc" ? null : v })
                }
            >
                <SelectTrigger className={cn(selectClass, "w-44")} aria-label="Trier par">
                    <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="date_asc">
                        <span className="flex items-center gap-2">
                            <IconCalendar className="w-3.5 h-3.5 text-muted-foreground" />
                            Date (proche)
                        </span>
                    </SelectItem>
                    <SelectItem value="date_desc">
                        <span className="flex items-center gap-2">
                            <IconCalendar className="w-3.5 h-3.5 text-muted-foreground" />
                            Date (lointain)
                        </span>
                    </SelectItem>
                    <SelectItem value="popular">
                        <span className="flex items-center gap-2">
                            <IconTrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                            Populaires
                        </span>
                    </SelectItem>
                    <SelectItem value="recent">
                        <span className="flex items-center gap-2">
                            <IconClock className="w-3.5 h-3.5 text-muted-foreground" />
                            Récemment ajoutés
                        </span>
                    </SelectItem>
                </SelectContent>
            </Select>

            {/* ── Séparateur ─────────────────────────────────────────────── */}
            <div className="flex-1 hidden md:block" />

            {/* ── Réinitialiser ──────────────────────────────────────────── */}
            {hasFilters && (
                <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-9 text-muted-foreground hover:text-foreground shrink-0"
                >
                    <Link href="/events">
                        <IconX className="w-3.5 h-3.5" aria-hidden="true" />
                        Réinitialiser
                    </Link>
                </Button>
            )}

            {/* ── Toggle vue grille / liste ──────────────────────────────── */}
            <div className="flex items-center gap-0.5 border rounded-lg p-0.5 shrink-0">
                <button
                    type="button"
                    onClick={() => navigate({ view: null })}
                    aria-label="Vue grille"
                    aria-pressed={currentView !== "list"}
                    className={cn(
                        "p-1.5 rounded-md transition-colors",
                        currentView !== "list"
                            ? "bg-secondary text-secondary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    <IconLayoutGrid className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                    type="button"
                    onClick={() => navigate({ view: "list" })}
                    aria-label="Vue liste"
                    aria-pressed={currentView === "list"}
                    className={cn(
                        "p-1.5 rounded-md transition-colors",
                        currentView === "list"
                            ? "bg-secondary text-secondary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    <IconList className="w-4 h-4" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}
