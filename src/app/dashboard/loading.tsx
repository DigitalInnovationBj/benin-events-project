import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-9 w-56" />
                <Skeleton className="h-4 w-72" />
            </div>

            {/* Cartes KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="rounded-2xl border bg-card p-5 space-y-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                ))}
            </div>

            {/* Graphique */}
            <Skeleton className="h-72 w-full rounded-2xl" />

            {/* Tableau */}
            <div className="rounded-2xl border bg-card p-5 space-y-3">
                <Skeleton className="h-6 w-40" />
                {Array.from({ length: 5 }, (_, i) => (
                    <Skeleton key={i} className="h-11 w-full" />
                ))}
            </div>
        </div>
    );
}
