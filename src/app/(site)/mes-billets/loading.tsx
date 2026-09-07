import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersLoading() {
    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>

            {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="rounded-2xl border bg-card p-5 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-7 w-2/5" />
                            <Skeleton className="h-3.5 w-1/3" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full shrink-0" />
                    </div>
                    <div className="flex gap-4 items-center border-t pt-4">
                        <Skeleton className="h-24 w-24 shrink-0 rounded-xl" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-3 w-1/3" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
