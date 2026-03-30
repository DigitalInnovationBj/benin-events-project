"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    Search,
    Grid,
    List,
    X,
    MapPin,
    MonitorPlay,
    Calendar,
    TrendingUp,
    Clock,
} from "lucide-react";
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

interface EventsFiltersProps {
    categories: Category[];
    currentSearch: string;
    currentCategory: string;
    currentType: string;
    currentSort: string;
    currentView: string;
    hasFilters: boolean;
}

export default function EventsFilters({
    categories,
    currentSearch,
    currentCategory,
    currentType,
    currentSort,
    currentView,
    hasFilters,
}: EventsFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();

    const [search, setSearch] = useState(currentSearch);

    // ── Sync input quand l'URL change (navigation arrière/avant) ────────────
    useEffect(() => {
        setSearch(currentSearch);
    }, [currentSearch]);

    // ── Construit l'URL avec les params mis à jour ──────────────────────────
    const buildUrl = useCallback(
        (updates: Record<string, string | null>) => {
            const base: Record<string, string> = {};

            if (currentSearch) base.q = currentSearch;
            if (currentCategory) base.category = currentCategory;
            if (currentType) base.type = currentType;
            if (currentSort && currentSort !== "date_asc")
                base.sort = currentSort;
            if (currentView && currentView !== "grid") base.view = currentView;

            // Appliquer les mises à jour
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
            currentSort,
            currentView,
        ],
    );

    const navigate = useCallback(
        (updates: Record<string, string | null>) => {
            router.push(buildUrl(updates), { scroll: false });
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

    return (
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {/* ── Recherche ──────────────────────────────────────────────── */}
            <div className="relative flex-1 min-w-45 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un évènement…"
                    className="pl-9 pr-8 h-9"
                />
                {search && (
                    <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Effacer la recherche"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* ── Catégorie ──────────────────────────────────────────────── */}
            <Select
                value={currentCategory || "all"}
                onValueChange={(v) =>
                    navigate({ category: v === "all" ? null : v })
                }
            >
                <SelectTrigger className="w-40 h-9 shrink-0">
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

            {/* ── Type d'évènement ───────────────────────────────────────── */}
            <Select
                value={currentType || "all"}
                onValueChange={(v) =>
                    navigate({ type: v === "all" ? null : v })
                }
            >
                <SelectTrigger className="w-36 h-9 shrink-0">
                    <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="IN_PERSON">
                        <span className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                            Présentiel
                        </span>
                    </SelectItem>
                    <SelectItem value="ONLINE">
                        <span className="flex items-center gap-2">
                            <MonitorPlay className="w-3.5 h-3.5 text-blue-500" />
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
                <SelectTrigger className="w-44 h-9 shrink-0">
                    <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="date_asc">
                        <span className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            Date (proche)
                        </span>
                    </SelectItem>
                    <SelectItem value="date_desc">
                        <span className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            Date (lointain)
                        </span>
                    </SelectItem>
                    <SelectItem value="popular">
                        <span className="flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                            Populaires
                        </span>
                    </SelectItem>
                    <SelectItem value="recent">
                        <span className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
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
                        <X className="w-3.5 h-3.5 mr-1.5" />
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
                    className={cn(
                        "p-1.5 rounded-md transition-colors",
                        currentView !== "list"
                            ? "bg-secondary text-secondary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    <Grid className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => navigate({ view: "list" })}
                    aria-label="Vue liste"
                    className={cn(
                        "p-1.5 rounded-md transition-colors",
                        currentView === "list"
                            ? "bg-secondary text-secondary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    <List className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
