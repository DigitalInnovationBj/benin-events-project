"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { IconArrowDown, IconArrowUp, IconGripVertical } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { reorderTickets, setTicketSort } from "@/actions/ticket.actions";
import { TICKET_SORT_LABELS, type TicketSortMode } from "@/lib/ticket-order";

/** Choix de l'ordre d'affichage des billets sur la page publique. */
export function TicketSortSelect({ eventId, value }: { eventId: string; value: TicketSortMode }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    return (
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Ordre d&apos;affichage</span>
            <select
                aria-label="Ordre d'affichage des billets"
                value={value}
                disabled={pending}
                onChange={(e) => {
                    const mode = e.target.value as TicketSortMode;
                    startTransition(async () => {
                        const res = await setTicketSort(eventId, mode);
                        if (res.error) {
                            toast.error(res.error);
                            return;
                        }
                        router.refresh();
                    });
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground"
            >
                {(Object.keys(TICKET_SORT_LABELS) as TicketSortMode[]).map((m) => (
                    <option key={m} value={m}>
                        {TICKET_SORT_LABELS[m]}
                    </option>
                ))}
            </select>
        </label>
    );
}

export type TicketListItem = {
    id: string;
    title: string;
    /** Contenu de la ligne, rendu côté serveur. */
    content: ReactNode;
    className?: string;
};

/**
 * Liste des billets. En ordre personnalisé, chaque ligne se déplace par
 * glisser-déposer (poignée) ou avec les flèches haut/bas ; l'ordre est
 * enregistré à chaque déplacement.
 *
 * Le parent passe `key` = ids dans l'ordre : la liste repart de l'état
 * serveur après chaque rafraîchissement (billet ajouté, ordre changé).
 */
export function SortableTicketList({
    eventId,
    custom,
    items,
}: {
    eventId: string;
    custom: boolean;
    items: TicketListItem[];
}) {
    const router = useRouter();
    const [order, setOrder] = useState(() => items.map((i) => i.id));
    const [saving, setSaving] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const byId = new Map(items.map((i) => [i.id, i]));
    const ordered = order.map((id) => byId.get(id)).filter((i): i is TicketListItem => !!i);

    async function save(next: string[]) {
        const previous = order;
        setOrder(next);
        setSaving(true);
        const res = await reorderTickets(eventId, next);
        setSaving(false);
        if (res.error) {
            setOrder(previous);
            toast.error(res.error);
            return;
        }
        router.refresh();
    }

    function onDragEnd({ active, over }: DragEndEvent) {
        if (!over || active.id === over.id) return;
        const from = order.indexOf(String(active.id));
        const to = order.indexOf(String(over.id));
        if (from < 0 || to < 0) return;
        save(arrayMove(order, from, to));
    }

    if (!custom) {
        return (
            <ul className="space-y-3">
                {ordered.map((item) => (
                    <li key={item.id} className={item.className}>
                        {item.content}
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={onDragEnd}
        >
            <SortableContext items={order} strategy={verticalListSortingStrategy}>
                <ul className={cn("space-y-3", saving && "opacity-80")} aria-busy={saving}>
                    {ordered.map((item, index) => (
                        <SortableRow
                            key={item.id}
                            item={item}
                            isFirst={index === 0}
                            isLast={index === ordered.length - 1}
                            disabled={saving}
                            onMove={(delta) => save(arrayMove(order, index, index + delta))}
                        />
                    ))}
                </ul>
            </SortableContext>
        </DndContext>
    );
}

function SortableRow({
    item,
    isFirst,
    isLast,
    disabled,
    onMove,
}: {
    item: TicketListItem;
    isFirst: boolean;
    isLast: boolean;
    disabled: boolean;
    onMove: (delta: number) => void;
}) {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
        useSortable({ id: item.id, disabled });

    return (
        <li
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={cn(item.className, "relative", isDragging && "z-10 shadow-lg ring-2 ring-secondary")}
        >
            <div className="flex shrink-0 flex-col items-center gap-0.5 self-center">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label={`Monter « ${item.title} »`}
                    disabled={disabled || isFirst}
                    onClick={() => onMove(-1)}
                >
                    <IconArrowUp className="size-4" aria-hidden="true" />
                </Button>
                <button
                    type="button"
                    ref={setActivatorNodeRef}
                    {...attributes}
                    {...listeners}
                    aria-label={`Déplacer « ${item.title} »`}
                    className="flex size-7 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent active:cursor-grabbing"
                >
                    <IconGripVertical className="size-4" aria-hidden="true" />
                </button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label={`Descendre « ${item.title} »`}
                    disabled={disabled || isLast}
                    onClick={() => onMove(1)}
                >
                    <IconArrowDown className="size-4" aria-hidden="true" />
                </Button>
            </div>
            {item.content}
        </li>
    );
}
