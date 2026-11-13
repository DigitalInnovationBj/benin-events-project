import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Chiffre clé du tableau de bord (carte sombre arrondie de la charte). */
export function StatTile({
    label,
    value,
    hint,
    highlight = false,
    className,
}: {
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    /** Valeur en or (montant à reverser, jour en cours…). */
    highlight?: boolean;
    className?: string;
}) {
    return (
        <div className={cn("rounded-2xl border bg-card p-4", className)}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p
                className={cn(
                    "mt-1 text-xl font-semibold tabular-nums sm:text-2xl",
                    highlight && "text-secondary",
                )}
            >
                {value}
            </p>
            {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}
