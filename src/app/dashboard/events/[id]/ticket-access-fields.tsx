"use client";

import { Label } from "@/components/ui/label";
import { formatDayKey } from "@/lib/ticket-days";

export type EventOption = { id: string; label: string };

/**
 * Champs « accès » d'un billet : pass multi-jours et accès à un autre évènement.
 *
 * Champs natifs (`validDays` en cases à cocher, `alsoValidForEventId` en liste) :
 * ils sont lus tels quels par `FormData` dans les server actions.
 */
export function TicketAccessFields({
    idPrefix,
    eventDays,
    defaultDays = [],
    eventOptions,
    defaultEventId = "",
}: {
    idPrefix: string;
    /** Jours de l'évènement, « YYYY-MM-DD ». */
    eventDays: string[];
    defaultDays?: string[];
    eventOptions: EventOption[];
    defaultEventId?: string;
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

            {eventOptions.length > 0 && (
                <div className="grid gap-2">
                    <Label htmlFor={`${idPrefix}-also-event`}>
                        Valable aussi pour un autre évènement{" "}
                        <span className="text-muted-foreground font-normal">
                            (Optionnel)
                        </span>
                    </Label>
                    <select
                        id={`${idPrefix}-also-event`}
                        name="alsoValidForEventId"
                        defaultValue={defaultEventId}
                        className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                    >
                        <option value="">Aucun</option>
                        {eventOptions.map((o) => (
                            <option key={o.id} value={o.id}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                        Le même QR code sera accepté par les agents de cet
                        évènement (ex. un pass VVIP donnant accès aux
                        conférences). Les jours cochés ci-dessus sont requis.
                    </p>
                </div>
            )}
        </>
    );
}
