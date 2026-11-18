"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IconDoorEnter, IconCash } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { ScanMode } from "@/components/agent/qr-scanner";

const STORAGE_KEY = "be-scan-mode";

/**
 * Choix explicite Vente / Entrée sur le scanner, pour les comptes qui ont les
 * deux rôles. Le dernier choix est mémorisé sur l'appareil.
 */
export function ScanModeSwitch({
    eventId,
    mode,
    showSwitch,
}: {
    eventId: string;
    mode: ScanMode;
    /** Le compte a les deux rôles : afficher le sélecteur et mémoriser. */
    showSwitch: boolean;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const explicit = searchParams.get("mode");

    useEffect(() => {
        if (!showSwitch) return;
        try {
            if (explicit) {
                localStorage.setItem(STORAGE_KEY, mode);
            } else if (localStorage.getItem(STORAGE_KEY) === "vente" && mode !== "vente") {
                router.replace(`/agent/${eventId}/scan?mode=vente`);
            }
        } catch {
            // Stockage indisponible (navigation privée) : pas de mémorisation.
        }
    }, [showSwitch, explicit, mode, eventId, router]);

    if (!showSwitch) return null;

    const options: { key: ScanMode; label: string; hint: string; icon: typeof IconCash }[] = [
        { key: "entree", label: "Entrée", hint: "Contrôle à l'entrée", icon: IconDoorEnter },
        { key: "vente", label: "Vente", hint: "Activer un billet vendu", icon: IconCash },
    ];

    return (
        <nav aria-label="Mode du scanner" className="grid grid-cols-2 gap-2 rounded-2xl border bg-card p-2 shadow-sm">
            {options.map((o) => {
                const active = o.key === mode;
                return (
                    <Link
                        key={o.key}
                        href={`/agent/${eventId}/scan?mode=${o.key}`}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                            "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-colors",
                            active && o.key === "vente" && "bg-secondary text-secondary-foreground",
                            active && o.key === "entree" && "bg-primary text-primary-foreground",
                            !active && "text-muted-foreground hover:bg-muted",
                        )}
                    >
                        <o.icon className="size-5" aria-hidden="true" />
                        <span className="flex flex-col leading-tight">
                            <span>{o.label}</span>
                            <span className="text-[11px] font-normal opacity-80">{o.hint}</span>
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
