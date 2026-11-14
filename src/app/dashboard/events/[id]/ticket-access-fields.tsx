"use client";

import { Label } from "@/components/ui/label";
import { formatDayKey } from "@/lib/ticket-days";

export type SessionOption = { id: string; label: string };

/**
 * Champs « accès » d'un billet : pass multi-jours et sessions accessibles.
 *
 * Champs natifs (`validDays` et `sessionIds` en cases à cocher) :
 * ils sont lus tels quels par `FormData` dans les server actions.
 */
export function TicketAccessFields({
    idPrefix,
    eventDays,
    defaultDays = [],
    sessionOptions,
    defaultSessionIds = [],
}: {
    idPrefix: string;
    /** Jours de l'évènement, « YYYY-MM-DD ». */
    eventDays: string[];
    defaultDays?: string[];
    sessionOptions: SessionOption[];
    defaultSessionIds?: string[];
}) {
    // Un jour déjà enregistré mais hors des dates actuelles de l'évènement
    // reste affiché, sinon l'enregistrer le supprimerait silencieusement.
    const days = [...new Set([...eventDays, ...defaultDays])].sort();

    return (
        <>
            {days.length > 1 && (
                <fieldset className="grid gap-2">
                    <Label asChild>
                        <legend>
                            Pass multi-jours{" "}
                            <span className="text-muted-foreground font-normal">
                                (Optionnel)
                            </span>
                        </legend>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                        Cochez les jours où ce billet donne accès : il sera
                        scannable une fois par jour. Ne cochez rien pour un
                        billet à entrée unique.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {days.map((day) => (
                            <label
                                key={day}
                                htmlFor={`${idPrefix}-day-${day}`}
                                className="flex items-center gap-2 text-sm cursor-pointer"
                            >
                                <input
                                    id={`${idPrefix}-day-${day}`}
                                    type="checkbox"
                                    name="validDays"
                                    value={day}
                                    defaultChecked={defaultDays.includes(day)}
                                    className="size-4 accent-primary"
                                />
                                {formatDayKey(day)}
                            </label>
                        ))}
                    </div>
                </fieldset>
            )}

            {sessionOptions.length > 0 && (
                <fieldset className="grid gap-2">
                    <Label asChild>
                        <legend>
                            Donne accès aux sessions{" "}
                            <span className="text-muted-foreground font-normal">
                                (Optionnel)
                            </span>
                        </legend>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                        Le même QR code sera accepté au point de contrôle de
                        chaque session cochée (ex. conférences pour le VVIP).
                    </p>
                    <div className="flex flex-col gap-2">
                        {sessionOptions.map((o) => (
                            <label
                                key={o.id}
                                htmlFor={`${idPrefix}-session-${o.id}`}
                                className="flex items-center gap-2 text-sm cursor-pointer"
                            >
                                <input
                                    id={`${idPrefix}-session-${o.id}`}
                                    type="checkbox"
                                    name="sessionIds"
                                    value={o.id}
                                    defaultChecked={defaultSessionIds.includes(o.id)}
                                    className="size-4 accent-primary"
                                />
                                {o.label}
                            </label>
                        ))}
                    </div>
                </fieldset>
            )}
        </>
    );
}
