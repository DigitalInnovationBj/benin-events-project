"use client";

import { useEffect, useMemo, useState } from "react";

interface EventCountdownProps {
    startDate: string;
}

function getRemainingParts(targetDate: Date) {
    const diffMs = targetDate.getTime() - Date.now();

    if (diffMs <= 0) {
        return null;
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { days, hours, minutes, seconds };
}

export default function EventCountdown({ startDate }: EventCountdownProps) {
    const targetDate = useMemo(() => new Date(startDate), [startDate]);
    const [remaining, setRemaining] = useState(() =>
        getRemainingParts(targetDate),
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setRemaining(getRemainingParts(targetDate));
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    if (!remaining) {
        return (
            <div className="rounded-2xl border border-secondary/30 bg-background/85 backdrop-blur-md shadow-xl px-5 py-4 min-w-[250px]">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Compteur
                </p>
                <p className="font-afo text-lg text-foreground">
                    L&apos;évènement a commencé
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-secondary/30 bg-background/85 backdrop-blur-md shadow-xl p-4 w-fit text-center">
            <span className="text-lg md:text-xl font-bold text-foreground">
                Dans &nbsp;
            </span>
            <span className="text-lg md:text-xl font-bold text-foreground">
                {remaining.days}j {remaining.hours}h {remaining.minutes}m{" "}
                {remaining.seconds}s
            </span>
        </div>
    );
}
