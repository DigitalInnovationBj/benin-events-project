"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
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
    IconFilter,
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
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

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
    /** Nombre de filtres actifs, affiché sur le déclencheur mobile. */
    activeCount: number;
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
    activeCount,
}: EventsFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    // `isPending` reste vrai tant que le serveur n'a pas renvoyé la nouvelle
    // liste : la barre affiche un indicateur au lieu de paraître figée.
    const [isPending, startTransition] = useTransition();
    const [drawerOpen, setDrawerOpen] = useState(false);

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

    // ─────────────────────────────────────────────
    // Fragments réutilisés par le panneau desktop et le drawer mobile
    // ─────────────────────────────────────────────

    const searchField = (
        <div className="relative">
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
                placeholder="Rechercher…"
                aria-label="Rechercher un évènement"
                className="pl-9 pr-8 h-10"
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
    );

    /** Un filtre = un label au-dessus d'un Select pleine largeur. */
    const field = (
        id: string,
        label: string,
        value: string,
        fallback: string,
        onChange: (v: string) => void,
        children: React.ReactNode,
    ) => (
        <div className="space-y-1.5">
            <label
                htmlFor={id}
                className="text-xs font-medium text-muted-foreground"
            >
                {label}
            </label>
            <Select value={value || fallback} onValueChange={onChange}>
                <SelectTrigger id={id} className="h-10 w-full">
                    <SelectValue placeholder={label} />
                </SelectTrigger>
                <SelectContent>{children}</SelectContent>
            </Select>
        </div>
    );

    const filterFields = (
        <>
            {field(
                "f-category",
                "Catégorie",
                currentCategory,
                "all",
                (v) => navigate({ category: v }),
                <>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.slug}>
                            {cat.name}
                        </SelectItem>
                    ))}
                </>,
            )}

            {field(
                "f-city",
                "Ville",
                currentCity,
                "all",
                (v) => navigate({ city: v }),
                <>
                    <SelectItem value="all">Toutes les villes</SelectItem>
                    {cities.map((city) => (
                        <SelectItem key={city.slug} value={city.slug}>
                            {city.name}
                        </SelectItem>
                    ))}
                </>,
            )}

            {field(
                "f-date",
                "Quand",
                currentDate,
                "all",
                (v) => navigate({ date: v }),
                <>
                    <SelectItem value="all">N&apos;importe quand</SelectItem>
                    <SelectItem value="today">Aujourd&apos;hui</SelectItem>
                    <SelectItem value="weekend">Ce week-end</SelectItem>
                    <SelectItem value="month">Ce mois-ci</SelectItem>
                </>,
            )}

            {field(
                "f-price",
                "Prix",
                currentPrice,
                "all",
                (v) => navigate({ price: v }),
                <>
                    <SelectItem value="all">Tous les prix</SelectItem>
                    <SelectItem value="free">Gratuit</SelectItem>
                    <SelectItem value="paid">Payant</SelectItem>
                </>,
            )}

            {field(
                "f-type",
                "Type",
                currentType,
                "all",
                (v) => navigate({ type: v }),
                <>
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
                </>,
            )}

            {field(
                "f-sort",
                "Trier par",
                currentSort,
                "date_asc",
                (v) => navigate({ sort: v === "date_asc" ? null : v }),
                <>
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
                </>,
            )}
        </>
    );

    const resetLink = hasFilters && (
        <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-foreground"
        >
            <Link href="/events">
                <IconX className="w-3.5 h-3.5" aria-hidden="true" />
                Réinitialiser les filtres
            </Link>
        </Button>
    );

    const viewToggle = (
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
    );

    return (
        <>
            {/* ══════════════════════════════════════════════════════════════
                Mobile & tablette — barre compacte + drawer
            ══════════════════════════════════════════════════════════════ */}
            {/* `top-16` = hauteur de la navbar collante. Les marges négatives
                font déborder le fond jusqu'aux bords de l'écran. */}
            <div className="lg:hidden sticky top-16 z-30 -mx-6 border-b bg-card/80 px-6 py-3 backdrop-blur-md md:-mx-12 md:px-12 flex items-center gap-2">
                <div className="flex-1">{searchField}</div>

                <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                    <DrawerTrigger asChild>
                        <Button
                            variant="outline"
                            className="h-10 shrink-0 gap-1.5"
                        >
                            <IconFilter className="w-4 h-4" aria-hidden="true" />
                            Filtres
                            {activeCount > 0 && (
                                <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-xs font-bold text-secondary-foreground">
                                    {activeCount}
                                </span>
                            )}
                        </Button>
                    </DrawerTrigger>

                    <DrawerContent className="max-h-[85vh]">
                        <DrawerHeader className="text-left">
                            <DrawerTitle className="font-afo text-2xl">
                                Filtrer les évènements
                            </DrawerTitle>
                        </DrawerHeader>

                        <div className="overflow-y-auto px-4 pb-4 space-y-4">
                            {filterFields}
                            {resetLink}
                        </div>

                        <div className="border-t p-4">
                            <DrawerClose asChild>
                                <Button className="w-full" size="lg">
                                    Voir les résultats
                                </Button>
                            </DrawerClose>
                        </div>
                    </DrawerContent>
                </Drawer>

                {viewToggle}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                Desktop — panneau latéral collant
            ══════════════════════════════════════════════════════════════ */}
            <aside
                className={cn(
                    "hidden lg:block transition-opacity",
                    isPending && "opacity-60",
                )}
                aria-label="Filtres"
            >
                <div className="sticky top-24 space-y-5 rounded-2xl border bg-card p-5">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="flex items-center gap-2 text-sm font-bold">
                            <IconFilter
                                className="w-4 h-4 text-secondary"
                                aria-hidden="true"
                            />
                            Filtres
                        </h2>
                        {viewToggle}
                    </div>

                    {searchField}
                    {filterFields}
                    {resetLink}
                </div>
            </aside>
        </>
    );
}
