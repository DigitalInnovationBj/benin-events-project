import { cn } from "@/lib/utils";
import type { ComponentType } from "react";
import {
    IconClock,
    IconLoader2,
    IconCircleCheck,
    IconCircleX,
    IconAlertTriangle,
    IconBan,
    IconArrowBackUp,
} from "@tabler/icons-react";

export type StatusTone = "neutral" | "info" | "warning" | "success" | "danger";

const TONE_CLASSES: Record<StatusTone, string> = {
    neutral: "bg-muted text-muted-foreground border-transparent",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-transparent",
    warning:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-transparent",
    success:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-transparent",
    danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-transparent",
};

interface StatusBadgeProps {
    tone: StatusTone;
    label: string;
    icon?: ComponentType<{ className?: string }>;
    className?: string;
}

/** Badge de statut unifié — remplace les 3 implémentations ad hoc (spans bruts,
 * STATUS_CONFIG dupliqué) utilisées à travers le dashboard/admin. */
export function StatusBadge({ tone, label, icon: Icon, className }: StatusBadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
                TONE_CLASSES[tone],
                className,
            )}
        >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
        </span>
    );
}

// ─────────────────────────────────────────────
// Mappings par domaine — un seul endroit à mettre à jour si un statut change.
// ─────────────────────────────────────────────

export function orderStatusBadge(status: string) {
    const map: Record<string, { tone: StatusTone; label: string; icon: ComponentType<{ className?: string }> }> = {
        PENDING: { tone: "warning", label: "En attente", icon: IconClock },
        COMPLETED: { tone: "success", label: "Payée", icon: IconCircleCheck },
        FAILED: { tone: "danger", label: "Échouée", icon: IconCircleX },
        EXPIRED: { tone: "neutral", label: "Expirée", icon: IconBan },
        CANCELLED: { tone: "neutral", label: "Annulée", icon: IconBan },
        REFUNDED: { tone: "info", label: "Remboursée", icon: IconArrowBackUp },
        PRINTED: { tone: "info", label: "Billets imprimés", icon: IconClock },
    };
    return map[status] ?? { tone: "neutral" as StatusTone, label: status, icon: IconClock };
}

export function payoutStatusBadge(status: string) {
    const map: Record<string, { tone: StatusTone; label: string; icon: ComponentType<{ className?: string }> }> = {
        PENDING: { tone: "warning", label: "En attente", icon: IconClock },
        PROCESSING: { tone: "info", label: "En cours", icon: IconLoader2 },
        PAID: { tone: "success", label: "Reversé", icon: IconCircleCheck },
        REJECTED: { tone: "danger", label: "Rejeté", icon: IconCircleX },
    };
    return map[status] ?? { tone: "neutral" as StatusTone, label: status, icon: IconClock };
}

export function requestStatusBadge(status: string) {
    const map: Record<string, { tone: StatusTone; label: string; icon: ComponentType<{ className?: string }> }> = {
        PENDING: { tone: "warning", label: "En attente", icon: IconClock },
        APPROVED: { tone: "success", label: "Approuvée", icon: IconCircleCheck },
        REJECTED: { tone: "danger", label: "Rejetée", icon: IconCircleX },
    };
    return map[status] ?? { tone: "neutral" as StatusTone, label: status, icon: IconClock };
}

export function agentStatusBadge(status: string) {
    const map: Record<string, { tone: StatusTone; label: string; icon: ComponentType<{ className?: string }> }> = {
        PENDING: { tone: "warning", label: "En attente", icon: IconClock },
        CONFIRMED: { tone: "success", label: "Confirmé", icon: IconCircleCheck },
        REVOKED: { tone: "danger", label: "Révoqué", icon: IconBan },
    };
    return map[status] ?? { tone: "neutral" as StatusTone, label: status, icon: IconClock };
}
