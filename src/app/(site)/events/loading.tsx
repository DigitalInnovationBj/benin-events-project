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

            <div className="max-w-6xl mx-auto px-6 md:px-12 pb-20">
                <div className="lg:grid lg:grid-cols-[17rem_1fr] lg:gap-8 lg:pt-8">
                    {/* Barre compacte mobile */}
                    <div className="lg:hidden flex items-center gap-2 py-3">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-20" />
                    </div>

                    {/* Panneau latéral desktop */}
                    <div className="hidden lg:block">
                        <div className="space-y-4 rounded-2xl border bg-card p-5">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-10 w-full" />
                            {Array.from({ length: 6 }, (_, i) => (
                                <div key={i} className="space-y-1.5">
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Grille */}
                    <div className="pt-8 lg:pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                            {Array.from({ length: 9 }, (_, i) => (
                                <EventCardSkeleton key={i} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
