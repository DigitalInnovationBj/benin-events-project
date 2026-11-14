"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconPlus, IconTrash, IconUsers } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEventSession, deleteEventSession } from "@/actions/event-session.actions";
import { formatDayKey } from "@/lib/ticket-days";

export type SessionItem = {
    id: string;
    name: string;
    day: string;
    capacity: number | null;
    ticketTitles: string[];
};

/**
 * Sessions à accès restreint de l'évènement (ex. conférences). Les billets
 * qui y donnent accès se choisissent dans le formulaire de chaque billet.
 */
export function SessionsPanel({
    eventId,
    eventDays,
    sessions,
}: {
    eventId: string;
    eventDays: string[];
    sessions: SessionItem[];
}) {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const [pending, startTransition] = useTransition();
    const [deleting, setDeleting] = useState<string | null>(null);

    const onCreate = (formData: FormData) => {
        startTransition(async () => {
            const res = await createEventSession(formData);
            if (res.error) {
                toast.error(res.error);
                return;
            }
            toast.success("Session ajoutée");
            formRef.current?.reset();
            router.refresh();
        });
    };

    const onDelete = async (id: string) => {
        setDeleting(id);
        const res = await deleteEventSession(id);
        setDeleting(null);
        if (res.error) {
            toast.error(res.error);
            return;
        }
        toast.success("Session supprimée");
        router.refresh();
    };

    return (
        <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-semibold">Sessions à accès restreint</h2>
            <p className="mt-1 text-sm text-muted-foreground">
                Conférences, espace VIP… Seuls les billets cochés y entrent, une
                fois, scannés à un point de contrôle dédié.
            </p>

            {sessions.length > 0 && (
                <ul className="mt-4 space-y-2">
                    {sessions.map((s) => (
                        <li key={s.id} className="flex items-start justify-between gap-3 rounded-xl border p-3">
                            <div className="min-w-0">
                                <p className="truncate font-medium">{s.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDayKey(s.day)}
                                    {s.capacity != null && ` · ${s.capacity} places`}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {s.ticketTitles.length > 0
                                        ? `Accès : ${s.ticketTitles.join(", ")}`
                                        : "Aucun billet n'y donne accès pour l'instant."}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`Supprimer la session ${s.name}`}
                                disabled={deleting === s.id}
                                onClick={() => onDelete(s.id)}
                            >
                                <IconTrash className="size-4" aria-hidden="true" />
                            </Button>
                        </li>
                    ))}
                </ul>
            )}

            <form ref={formRef} action={onCreate} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
                <input type="hidden" name="eventId" value={eventId} />
                <div className="grid gap-1.5">
                    <Label htmlFor="session-name">Nom</Label>
                    <Input id="session-name" name="name" placeholder="Conférences" required maxLength={80} />
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="session-day">Jour</Label>
                    <select
                        id="session-day"
                        name="day"
                        required
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                        {eventDays.map((d) => (
                            <option key={d} value={d}>
                                {formatDayKey(d)}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="session-capacity" className="flex items-center gap-1">
                        <IconUsers className="size-3.5" aria-hidden="true" /> Places
                    </Label>
                    <Input
                        id="session-capacity"
                        name="capacity"
                        type="number"
                        min={1}
                        placeholder="Illimité"
                        className="sm:w-28"
                    />
                </div>
                <Button type="submit" variant="secondary" disabled={pending}>
                    <IconPlus className="size-4" aria-hidden="true" />
                    Ajouter
                </Button>
            </form>
        </section>
    );
}
