"use client";

import { useEffect, useState } from "react";
import { IconTicket } from "@tabler/icons-react";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
    /** `id` de la section billetterie à atteindre. */
    targetId: string;
    /** Prix du billet le moins cher, affiché comme accroche. */
    fromPrice: number | null;
}

/**
 * Raccourci flottant vers la billetterie, sur mobile et tablette.
 *
 * La colonne de billets est collante sur desktop, mais passe tout en bas de
 * page sur petit écran : rien n'indiquait comment acheter sans faire défiler
 * l'intégralité de la description.
 *
 * Le bouton s'efface dès que la section est à l'écran, pour ne pas doublonner
 * avec les vrais boutons d'achat.
 */
export function TicketsAnchorButton({ targetId, fromPrice }: Props) {
    // Masqué au départ : inutile de le montrer avant de savoir où en est le
    // défilement, et la billetterie est souvent déjà visible sur grand écran.
    const [hidden, setHidden] = useState(true);

    useEffect(() => {
        const target = document.getElementById(targetId);
        if (!target) return;

        const observer = new IntersectionObserver(
            ([entry]) => setHidden(entry.isIntersecting),
            // Une portion suffit : dès que le haut de la billetterie entre
            // dans le viewport, le raccourci n'a plus lieu d'être.
            { rootMargin: "0px 0px -25% 0px" },
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, [targetId]);

    function scrollToTickets() {
        const target = document.getElementById(targetId);
        if (!target) return;

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;

        target.scrollIntoView({
            behavior: prefersReducedMotion ? "auto" : "smooth",
            block: "start",
        });
    }

    return (
        <button
            type="button"
            onClick={scrollToTickets}
            aria-hidden={hidden}
            tabIndex={hidden ? -1 : 0}
            aria-label={
                fromPrice === null || fromPrice === 0
                    ? "Voir la billetterie"
                    : `Voir la billetterie, à partir de ${formatXOF(fromPrice)}`
            }
            className={cn(
                "fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-bold text-secondary-foreground shadow-xl transition-all duration-300 lg:hidden",
                "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "motion-reduce:transition-none",
                hidden
                    ? "pointer-events-none translate-y-4 opacity-0"
                    : "translate-y-0 opacity-100",
            )}
        >
            <IconTicket className="h-5 w-5" aria-hidden="true" />
            {/* Icône + prix seulement : le libellé complet débordait sur les
                petits écrans. L'intention reste portée par `aria-label`. */}
            {fromPrice === null ? "Billets" : formatXOF(fromPrice)}
        </button>
    );
}
