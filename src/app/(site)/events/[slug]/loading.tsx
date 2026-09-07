import { Skeleton } from "@/components/ui/skeleton";

export default function EventDetailLoading() {
    return (
        <div className="bg-background">
            {/* Hero image + titre */}
            <div className="relative h-80 md:h-[28rem] bg-muted">
                <div className="absolute inset-x-0 bottom-0 max-w-5xl mx-auto px-6 pb-8 md:px-12 space-y-3">
                    <Skeleton className="h-5 w-28 rounded-full" />
                    <Skeleton className="h-14 w-4/5 max-w-2xl" />
                    <Skeleton className="h-4 w-56" />
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 md:px-12 py-10 grid gap-10 lg:grid-cols-3">
                {/* Colonne principale */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>

                    <div className="space-y-3">
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                    </div>
                </div>

                {/* Colonne billets */}
                <div className="space-y-4">
                    <Skeleton className="h-8 w-32" />
                    {Array.from({ length: 3 }, (_, i) => (
                        <div
                            key={i}
                            className="rounded-2xl border bg-card p-5 space-y-3"
                        >
                            <Skeleton className="h-6 w-2/3" />
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
