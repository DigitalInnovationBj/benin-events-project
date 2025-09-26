"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { List, Grid, MapPin } from "lucide-react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";

type Category = {
    id: string;
    name: string;
};

type City = {
    id: string;
    name: string;
};

type Event = {
    id: string;
    title: string;
    slug: string;
    date: string;
    city: City | string;
    category: Category | string;
    price: number;
    imageUrl?: string | null;
    description?: string | null;
};

export default function EventsPage() {
    const [events, setEvents] = React.useState<Event[]>([]);
    const [filteredEvents, setFilteredEvents] = React.useState<Event[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    // Filtres
    const [view, setView] = React.useState<"list" | "card">("card");
    const [selectedCategory, setSelectedCategory] =
        React.useState<string>("all");
    const [selectedCity, setSelectedCity] = React.useState<string>("all");
    const [dateFilter, setDateFilter] = React.useState<string>("all"); // ex: 'future', 'past', 'all'
    const [searchTerm, setSearchTerm] = React.useState<string>("");

    React.useEffect(() => {
        async function fetchEvents() {
            try {
                const res = await fetch("/api/users/events");
                if (!res.ok)
                    throw new Error(
                        "Erreur lors de la récupération des événements"
                    );

                const json = await res.json();
                setEvents(json.data); // ← le tableau est ici
                setFilteredEvents(json.data);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Erreur inconnue");
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, []);

    // Extraire catégories et villes uniques depuis les événements pour les filtres
    const categories = React.useMemo(() => {
        const cats = events
            .map((e) =>
                typeof e.category === "string"
                    ? e.category
                    : e.category?.name ?? ""
            )
            .filter(Boolean);
        return ["all", ...Array.from(new Set(cats))];
    }, [events]);

    const cities = React.useMemo(() => {
        const cts = events
            .map((e) =>
                typeof e.city === "string" ? e.city : e.city?.name ?? ""
            )
            .filter(Boolean);
        return ["all", ...Array.from(new Set(cts))];
    }, [events]);

    // Appliquer les filtres chaque fois que l'un change
    React.useEffect(() => {
        let filtered = [...events];

        if (selectedCategory !== "all") {
            filtered = filtered.filter((e) => e.category === selectedCategory);
        }

        if (selectedCity !== "all") {
            filtered = filtered.filter((e) => e.city === selectedCity);
        }

        if (dateFilter === "future") {
            filtered = filtered.filter((e) => new Date(e.date) >= new Date());
        } else if (dateFilter === "past") {
            filtered = filtered.filter((e) => new Date(e.date) < new Date());
        }

        if (searchTerm.trim()) {
            filtered = filtered.filter((e) =>
                e.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredEvents(filtered);
    }, [selectedCategory, selectedCity, dateFilter, searchTerm, events]);

    return (
        <>
            <Header />
            <main className="max-w-7xl mx-auto p-4 md:p-8 mt-20 md:mt-40 mb-40">
                <h1 className="text-4xl font-unbounded font-bold mb-8 text-center md:text-left">
                    Tous les événements
                </h1>

                {/* FILTRES */}
                <section className="mb-8 grid grid-cols-1 md:grid-cols-5 gap-4 md:items-end">
                    <div>
                        <label
                            htmlFor="category"
                            className="block font-semibold mb-1"
                        >
                            Catégorie
                        </label>
                        <select
                            id="category"
                            value={selectedCategory}
                            onChange={(e) =>
                                setSelectedCategory(e.target.value)
                            }
                            className="input w-full"
                        >
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat === "all" ? "Toutes" : cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="city"
                            className="block font-semibold mb-1"
                        >
                            Ville
                        </label>
                        <select
                            id="city"
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            className="input w-full"
                        >
                            {cities.map((city) => (
                                <option key={city} value={city}>
                                    {city === "all" ? "Toutes" : city}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="dateFilter"
                            className="block font-semibold mb-1"
                        >
                            Date
                        </label>
                        <select
                            id="dateFilter"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="input w-full"
                        >
                            <option value="all">Toutes</option>
                            <option value="future">À venir</option>
                            <option value="past">Passées</option>
                        </select>
                    </div>

                    <div className="col-span-2 md:col-span-1">
                        <label
                            htmlFor="searchTerm"
                            className="block font-semibold mb-1"
                        >
                            Rechercher
                        </label>
                        <input
                            id="searchTerm"
                            type="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Rechercher par titre..."
                            className="input w-full"
                        />
                    </div>

                    {/* Switch vue */}
                    <div className="flex items-center justify-end space-x-3 md:col-span-1 md:row-span-1">
                        <button
                            onClick={() => setView("list")}
                            aria-label="Vue liste"
                            className={`p-2 rounded-md hover:bg-gray-200 transition ${
                                view === "list"
                                    ? "bg-primary text-white"
                                    : "bg-gray-100"
                            }`}
                        >
                            <List
                                className={`w-5 h-5 ${
                                    view === "list"
                                        ? "text-white"
                                        : "text-gray-700"
                                }`}
                            />
                        </button>
                        <button
                            onClick={() => setView("card")}
                            aria-label="Vue carte"
                            className={`p-2 rounded-md hover:bg-gray-200 transition ${
                                view === "card"
                                    ? "bg-primary text-white"
                                    : "bg-gray-100"
                            }`}
                        >
                            <Grid
                                className={`w-5 h-5 ${
                                    view === "card"
                                        ? "text-white"
                                        : "text-gray-700"
                                }`}
                            />
                        </button>
                    </div>
                </section>

                {/* CONTENU EVENTS */}
                {loading && <p>Chargement des événements...</p>}
                {error && <p className="text-red-600">Erreur : {error}</p>}

                {!loading && !error && filteredEvents.length === 0 && (
                    <p>Aucun événement ne correspond à vos critères.</p>
                )}

                {!loading && !error && filteredEvents.length > 0 && (
                    <section>
                        {view === "list" ? (
                            <ul className="divide-y divide-gray-300">
                                {filteredEvents.map((event) => (
                                    <li key={event.id} className="py-4">
                                        <Link
                                            href={`/events/${event.slug}`}
                                            className="hover:bg-primary p-4 rounded transition grid grid-cols-[120px_1fr] gap-4 items-center"
                                        >
                                            {event.imageUrl ? (
                                                <Image
                                                    src={event.imageUrl}
                                                    alt={event.title}
                                                    width={120}
                                                    height={80}
                                                    className="rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-30 h-20 bg-gray-200 flex items-center justify-center text-gray-500 rounded-lg">
                                                    Pas d’image
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <h3 className="text-lg font-semibold font-unbounded">
                                                    {event.title}
                                                </h3>
                                                <p className="text-sm text-gray-700">
                                                    {new Date(
                                                        event.date
                                                    ).toLocaleDateString(
                                                        "fr-FR",
                                                        {
                                                            year: "numeric",
                                                            month: "long",
                                                            day: "numeric",
                                                        }
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-600 flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />{" "}
                                                    {typeof event.city ===
                                                    "string"
                                                        ? event.city
                                                        : event.city?.name ??
                                                          ""}
                                                </p>
                                                {event.description && (
                                                    <p className="mt-2 text-gray-700 line-clamp-2">
                                                        {event.description}
                                                    </p>
                                                )}
                                                <p className="mt-auto font-semibold text-primary">
                                                    {event.price} FCFA
                                                </p>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                                {filteredEvents.map((event) => (
                                    <Link
                                        key={event.id}
                                        href={`/events/${event.slug}`}
                                        className="block border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
                                    >
                                        {event.imageUrl ? (
                                            <Image
                                                src={event.imageUrl}
                                                alt={event.title}
                                                width={300}
                                                height={200}
                                                className="w-full h-48 object-cover rounded-t-lg"
                                            />
                                        ) : (
                                            <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500 rounded-t-lg">
                                                Pas d’image
                                            </div>
                                        )}
                                        <div className="p-4 flex flex-col h-full">
                                            <h3 className="text-lg font-semibold font-unbounded mb-1">
                                                {event.title}
                                            </h3>
                                            <p className="text-sm text-gray-700 mb-1">
                                                {new Date(
                                                    event.date
                                                ).toLocaleDateString("fr-FR", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                })}
                                            </p>
                                            <p className="text-xs text-gray-600 flex items-center gap-1 mb-3">
                                                <MapPin className="w-4 h-4" />{" "}
                                                {typeof event.city === "string"
                                                    ? event.city
                                                    : event.city?.name ?? ""}
                                            </p>
                                            {event.description && (
                                                <p className="text-gray-700 line-clamp-3 flex-grow">
                                                    {event.description}
                                                </p>
                                            )}
                                            <p className="mt-3 font-semibold text-primary">
                                                {event.price} FCFA
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </main>
            <Footer />
        </>
    );
}
