import { Skeleton } from "@/components/ui/skeleton";

/**
 * Fallbacks de Suspense pour les sections de l'accueil et les listes
 * d'évènements. Ils reprennent les gabarits réels (mêmes hauteurs, mêmes
 * gouttières) pour que l'arrivée du contenu ne provoque pas de saut de mise en
 * page.
 */

/** Carte évènement — miroir de la variante `grid` de EventCard. */
export function EventCardSkeleton() {
    return (
        <div className="h-full flex flex-col overflow-hidden rounded-3xl border-2 border-transparent bg-card">
            <Skeleton className="h-48 shrink-0 rounded-none rounded-t-3xl" />
            <div className="flex flex-col flex-1 p-5 space-y-3">
                <div className="flex gap-1.5">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-8 w-4/5" />
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3.5 w-1/2" />
                <div className="flex items-center justify-between pt-3 border-t mt-auto">
                    <Skeleton className="h-6 w-28" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </div>
        </div>
    );
}

/** Ligne évènement — miroir de la variante `list` de EventCard. */
export function EventListItemSkeleton() {
    return (
        <div className="flex items-center gap-4 rounded-2xl border bg-card p-3 md:p-4">
            <Skeleton className="w-20 h-20 sm:w-28 sm:h-20 shrink-0 rounded-xl" />
            <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-7 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
            </div>
            <Skeleton className="hidden sm:block h-5 w-24 shrink-0" />
        </div>
    );
}

/** Grille de cartes. */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <section className="py-14">
            <div className="max-w-6xl mx-auto px-6 md:px-12">
                <Skeleton className="h-4 w-28 mb-3" />
                <Skeleton className="h-10 w-72 mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: count }, (_, i) => (
                        <EventCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}

/** Carrousel pleine largeur (FeaturedEvents, UpcomingThisWeek). */
export function SliderSkeleton() {
    return (
        <section className="py-14">
            <div className="max-w-6xl mx-auto px-6 md:px-12 space-y-6">
                <div>
                    <Skeleton className="h-4 w-28 mb-3" />
                    <Skeleton className="h-10 w-64" />
                </div>
                <Skeleton className="h-72 md:h-96 w-full rounded-3xl" />
            </div>
        </section>
    );
}

/** Bandeau générique (catégories, villes). */
export function SectionSkeleton() {
    return (
        <section className="py-14 border-t">
            <div className="max-w-6xl mx-auto px-6 md:px-12 space-y-6">
                <div>
                    <Skeleton className="h-4 w-28 mb-3" />
                    <Skeleton className="h-10 w-72" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    {Array.from({ length: 6 }, (_, i) => (
                        <Skeleton key={i} className="h-28 rounded-2xl" />
                    ))}
                </div>
            </div>
        </section>
    );
}
