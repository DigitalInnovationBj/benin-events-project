"use client";

import * as React from "react";
import Link from "next/link";
import { List, Grid, MapPin, Heart, Share2, Users } from "lucide-react";
import Image from "next/image";

type Event = {
    id: string;
    title: string;
    slug: string;
    startDateTime: string;
    city: string;
    imageUrl?: string | null;
    description?: string | null;
};

export function LatestEvents() {
    const [events, setEvents] = React.useState<Event[]>([]);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<string | null>(null);
    const [view, setView] = React.useState<"list" | "card">("card");

    React.useEffect(() => {
        async function fetchEvents() {
            try {
                const res = await fetch("/api/users/events");

                if (!res.ok)
                    throw new Error(
                        "Erreur lors de la récupération des événements"
                    );

                const json = await res.json();
                console.log("API response ===>", json);

                // Vérifie si json.data est bien un tableau
                if (Array.isArray(json.data)) {
                    setEvents(json.data);
                } else {
                    throw new Error("Format de données inattendu");
                }
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Erreur inconnue"
                );
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, []);

    // Sélection des 4 derniers événements triés par date décroissante
    const latest = events
        .slice()
        .sort(
            (a, b) =>
                new Date(b.startDateTime).getTime() -
                new Date(a.startDateTime).getTime()
        )
        .slice(0, 4);

    return (
        <section className="max-w-6xl mx-auto px-4 py-20 lg:py-40">
            <header className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold font-unbounded">
                    Derniers événements
                </h2>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setView("list")}
                        aria-label="Vue liste"
                        className={`p-2 rounded-md hover:bg-purple-600 hover:cursor-pointer transition ${
                            view === "list" ? "bg-primary" : ""
                        }`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setView("card")}
                        aria-label="Vue carte"
                        className={`p-2 rounded-md hover:bg-purple-600 hover:cursor-pointer transition ${
                            view === "card" ? "bg-primary" : ""
                        }`}
                    >
                        <Grid className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Gestion des états */}
            {loading && <p>Chargement des événements...</p>}
            {error && <p className="text-red-600">Erreur : {error}</p>}

            {!loading && !error && (
                <>
                    {view === "list" ? (
                        <ul className="divide-y divide-gray-300">
                            {latest.map((event) => (
                                <li key={event.id} className="py-4">
                                    <Link
                                        href={`/events/${event.slug}`}
                                        className="block hover:bg-primary rounded transition overflow-hidden"
                                    >
                                        <div className="flex flex-col md:flex-row items-center gap-4 p-2">
                                            {/* Image avec position relative pour icônes */}
                                            <div className="relative flex-shrink-0 w-full md:w-48 rounded-xl overflow-hidden shadow-md shadow-primary/50">
                                                {event.imageUrl ? (
                                                    <Image
                                                        src={event.imageUrl}
                                                        alt={event.title}
                                                        width={300}
                                                        height={250}
                                                        className="w-full h-36 md:h-full object-cover rounded-xl"
                                                    />
                                                ) : (
                                                    <div className="w-full h-36 md:h-full bg-gray-200 flex items-center justify-center text-gray-500 rounded-xl">
                                                        <Image
                                                            src="/weloveya.jpg"
                                                            alt={event.title}
                                                            width={300}
                                                            height={250}
                                                            className="w-full h-36 md:h-full object-cover rounded-xl"
                                                        />
                                                    </div>
                                                )}

                                                {/* Icône cœur en haut à gauche */}
                                                <button
                                                    aria-label="Like"
                                                    className="absolute top-2 left-2 bg-primary bg-opacity-70 rounded-full p-1.5 hover:bg-opacity-100 transition shadow"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        // TODO: gérer le like (ex: appel API)
                                                    }}
                                                    type="button"
                                                >
                                                    <Heart className="w-5 h-5 text-white" />
                                                </button>

                                                {/* Icône partage en haut à droite */}
                                                <button
                                                    aria-label="Partager"
                                                    className="absolute top-2 right-2 bg-primary bg-opacity-70 rounded-full p-1.5 hover:bg-opacity-100 transition shadow"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        // TODO: ouvrir modal ou partager
                                                    }}
                                                    type="button"
                                                >
                                                    <Share2 className="w-5 h-5 text-white" />
                                                </button>

                                                {/* Icône users + nombre en bas à gauche */}
                                                <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-primary bg-opacity-70 rounded-full px-3 py-1 shadow">
                                                    <Users className="w-4 h-4 text-white" />
                                                    <span className="text-xs font-semibold text-white">
                                                        {/* Remplace ici par event.participantsCount si disponible */}
                                                        00
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Détails texte */}
                                            <div className="flex flex-col justify-between flex-1">
                                                <div>
                                                    <h3 className="text-lg font-semibold font-unbounded mb-1 line-clamp-2">
                                                        {event.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-300 mb-1">
                                                        {new Date(
                                                            event.startDateTime
                                                        ).toLocaleDateString(
                                                            "fr-FR",
                                                            {
                                                                year: "numeric",
                                                                month: "long",
                                                                day: "numeric",
                                                            }
                                                        )}
                                                    </p>

                                                    {event.city && (
                                                        <p className="text-xs mb-2 flex items-center gap-x-1 line-clamp-1 text-gray-300">
                                                            <MapPin className="w-4 h-4 inline" />{" "}
                                                            {event.city}
                                                        </p>
                                                    )}

                                                    {event.description && (
                                                        <p className="text-gray-300 line-clamp-3 text-sm">
                                                            {event.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {latest.map((event) => (
                                <Link
                                    key={event.id}
                                    href={`/events/${event.slug}`}
                                    className="block border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
                                >
                                    <div
                                        className="relative border rounded-xl overflow-hidden  shadow-md shadow-primary/50 transition"
                                        key={event.id}
                                    >
                                        {event.imageUrl ? (
                                            <Image
                                                src={event.imageUrl}
                                                alt={event.title}
                                                width={300}
                                                height={250}
                                                className="w-full h-52 object-cover rounded-xl"
                                            />
                                        ) : (
                                            <div className="w-full h-36 md:h-full bg-gray-200 flex items-center justify-center text-gray-500 rounded-xl">
                                                <Image
                                                    src="/weloveya.jpg"
                                                    alt={event.title}
                                                    width={300}
                                                    height={250}
                                                    className="w-full h-36 md:h-full object-cover rounded-xl"
                                                />
                                            </div>
                                        )}

                                        {/* Icône cœur en haut à gauche */}
                                        <button
                                            aria-label="Like"
                                            className="absolute top-2 left-2 bg-primary bg-opacity-70 rounded-full p-1.5 hover:bg-opacity-100 transition shadow"
                                            onClick={() => {
                                                // TODO: gérer le like (ex: appel API)
                                            }}
                                            type="button"
                                        >
                                            <Heart className="w-5 h-5 text-white" />
                                        </button>

                                        {/* Icône partage en haut à droite */}
                                        <button
                                            aria-label="Partager"
                                            className="absolute top-2 right-2 bg-primary bg-opacity-70 rounded-full p-1.5 hover:bg-opacity-100 transition shadow"
                                            onClick={() => {
                                                // TODO: ouvrir modal ou partager
                                            }}
                                            type="button"
                                        >
                                            <Share2 className="w-5 h-5 text-white" />
                                        </button>

                                        {/* Icône users + nombre en bas à gauche */}
                                        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-primary bg-opacity-70 rounded-full px-3 py-1 shadow">
                                            <Users className="w-4 h-4 text-white" />
                                            <span className="text-xs font-semibold text-white">
                                                00
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4 flex items-center gap-x-4">
                                        <div className="w-1/3 border-r border-primary p-2">
                                            <p className="text-2xl text-center font-semibold font-unbounded text-gray-300 mb-2">
                                                {new Date(
                                                    event.startDateTime
                                                ).toLocaleDateString("en-EN", {
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </p>
                                        </div>
                                        <div className="w-2/3">
                                            {event.city && (
                                                <p className="text-xs mb-2 flex items-center gap-x-1 line-clamp-1">
                                                    <MapPin className="w-4 h-4" />{" "}
                                                    {event.city}
                                                </p>
                                            )}
                                            {event.title && (
                                                <h3 className="line-clamp-2 text-sm font-unbounded font-semibold mb-1">
                                                    {event.title}
                                                </h3>
                                            )}
                                            {event.description && (
                                                <p className="line-clamp-3 text-xs">
                                                    {event.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="mt-10 text-center">
                        <Link
                            href="/events"
                            className="inline-block bg-primary text-white text-xs md:text-sm font-semibold px-8 py-2 rounded-full shadow hover:bg-purple-700 transition"
                        >
                            Voir plus d&apos;événements
                        </Link>
                    </div>
                </>
            )}
        </section>
    );
}
