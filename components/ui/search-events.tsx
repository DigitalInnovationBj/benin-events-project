"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

type Event = {
    id: string;
    title: string;
    slug: string;
};

export function SearchEvents() {
    const [open, setOpen] = React.useState(false);
    const [value, setValue] = React.useState("");
    const [events, setEvents] = React.useState<Event[]>([]);
    const [loading, setLoading] = React.useState(false);

    // Charger les événements au montage ou quand le popover s'ouvre
    React.useEffect(() => {
        if (open && events.length === 0) {
            setLoading(true);
            fetch("/api/events") // adapte l'URL à ton API réelle
                .then((res) => res.json())
                .then((data: Event[]) => {
                    setEvents(data);
                })
                .catch(() => {
                    setEvents([]);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [open, events.length]);

    // Filtrer les événements par label selon la saisie value
    const filteredEvents = value
        ? events.filter((event) =>
              event.title.toLowerCase().includes(value.toLowerCase())
          )
        : events;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    role="combobox"
                    aria-expanded={open}
                    className="flex items-center gap-2 px-5 py-2 rounded-full text-xs md:text-sm bg-primary hover:cursor-pointer hover:bg-purple-600 transition"
                >
                    {value
                        ? events.find((event) => event.slug === value)?.title
                        : "Rechercher..."}
                    <Search className="w-4 h-4" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput
                        placeholder="Rechercher un événement..."
                        className="h-9"
                        value={
                            value
                                ? events.find((ev) => ev.slug === value)
                                      ?.title || value
                                : ""
                        }
                        onValueChange={(text) => setValue(text)}
                    />
                    <CommandList>
                        {loading && <CommandEmpty>Chargement...</CommandEmpty>}
                        {!loading && filteredEvents.length === 0 && (
                            <CommandEmpty>Aucun événement trouvé.</CommandEmpty>
                        )}
                        <CommandGroup>
                            {filteredEvents.map((event) => (
                                <CommandItem
                                    key={event.id}
                                    value={event.slug} // on utilise le slug comme valeur sélectionnable
                                    onSelect={(currentValue) => {
                                        setValue(
                                            currentValue === value
                                                ? ""
                                                : currentValue
                                        );
                                        setOpen(false);
                                    }}
                                >
                                    <Link
                                        href={`/events/${event.slug}`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* on met onClick stopPropagation pour que Link ne ferme pas le popover juste au clic */}
                                        {event.title}
                                    </Link>
                                    <Check
                                        className={cn(
                                            "ml-auto",
                                            value === event.slug
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
