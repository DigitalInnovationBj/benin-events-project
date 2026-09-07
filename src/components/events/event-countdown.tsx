"use client";

import { useEffect, useMemo, useState } from "react";
import { IconCalendarEvent } from "@tabler/icons-react";

interface EventCountdownProps {
    startDate: string;
}

type Remaining = {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
};

function getRemainingParts(targetDate: Date): Remaining | null {
    const diffMs = targetDate.getTime() - Date.now();
    if (diffMs <= 0) return null;

    const totalSeconds = Math.floor(diffMs / 1000);
    return {
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
    };
}

function Segment({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <span className="font-afo text-2xl leading-none tabular-nums text-foreground sm:text-3xl">
                {String(value).padStart(2, "0")}
            </span>
            <span className="mt-1 text-[0.625rem] uppercase tracking-wider text-muted-foreground">
                {label}
            </span>
        </div>
    );
}

/**
 * Compte à rebours jusqu'au début de l'évènement.
 *
 * Rendu en segments plutôt qu'en une ligne « 3j 4h 12m 8s » : les chiffres
 * sont plus lisibles d'un coup d'œil, et la largeur ne saute plus à chaque
 * seconde (chiffres tabulaires et padding à deux chiffres).
 *
 * Le calcul dépend de l'heure courante : il n'a lieu qu'après hydratation,
 * sinon le rendu serveur et le rendu client divergeraient.
 */
export default function EventCountdown({ startDate }: EventCountdownProps) {
    const targetDate = useMemo(() => new Date(startDate), [startDate]);
    // `undefined` = pas encore calculé (rendu serveur et premier rendu client),
    // `null` = l'évènement a commencé.
    const [remaining, setRemaining] = useState<Remaining | null | undefined>(
        undefined,
    );

    useEffect(() => {
        const tick = () => setRemaining(getRemainingParts(targetDate));
        // Le premier calcul passe par un timer plutôt que par le corps de
        // l'effet : un setState synchrone y déclencherait un rendu en cascade.
        const timeout = setTimeout(tick, 0);
        const interval = setInterval(tick, 1000);
        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [targetDate]);

    // Réserve la place avant le premier calcul, pour éviter un saut de mise en page.
    if (remaining === undefined) {
        return <div className="h-[4.5rem]" aria-hidden="true" />;
    }

    if (remaining === null) {
        return (
            <div className="inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-medium">
                <IconCalendarEvent
                    className="h-4 w-4 text-secondary"
                    aria-hidden="true"
                />
                L&apos;évènement a commencé
            </div>
        );
    }

    return (
        <div
            className="inline-flex items-center gap-4 rounded-xl border bg-card px-4 py-3 sm:gap-5 sm:px-5"
            role="timer"
            aria-label={`Début dans ${remaining.days} jours, ${remaining.hours} heures et ${remaining.minutes} minutes`}
        >
            <Segment value={remaining.days} label="jours" />
            <Segment value={remaining.hours} label="h" />
            <Segment value={remaining.minutes} label="min" />
            <Segment value={remaining.seconds} label="sec" />
        </div>
    );
}
