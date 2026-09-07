import { Skeleton } from "@/components/ui/skeleton";
import { EventCardSkeleton } from "@/components/sections/section-skeletons";

export default function EventsLoading() {
    return (
        <div className="bg-background">
            {/* Hero */}
            <div className="relative border-b h-52 md:h-72 bg-muted">
                <div className="relative z-10 h-full flex flex-col justify-end max-w-6xl mx-auto px-6 pb-6 md:px-12 md:pb-8">
                    <Skeleton className="h-12 w-64 mb-2" />
                    <Skeleton className="h-4 w-40" />
                </div>
            </div>

            {/* Barre de filtres */}
            <div className="border-b bg-card/80">
                <div className="max-w-6xl mx-auto px-6 py-3 md:px-12 flex flex-wrap gap-3">
                    <Skeleton className="h-10 flex-1 min-w-50" />
                    <Skeleton className="h-10 w-36" />
                    <Skeleton className="h-10 w-36" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>

            {/* Grille */}
            <div className="max-w-6xl mx-auto px-6 py-8 pb-20 md:px-12">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 9 }, (_, i) => (
                        <EventCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}
