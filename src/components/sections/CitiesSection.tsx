import prisma from "@/lib/prisma";
import Link from "next/link";
import { MapPin } from "lucide-react";

const CITIES = [
    {
        name: "Cotonou",
        slug: "cotonou",
        from: "from-blue-600",
        to: "to-blue-900",
    },
    {
        name: "Porto-Novo",
        slug: "porto-novo",
        from: "from-emerald-600",
        to: "to-emerald-900",
    },
    {
        name: "Parakou",
        slug: "parakou",
        from: "from-orange-500",
        to: "to-orange-800",
    },
    {
        name: "Abomey-Calavi",
        slug: "abomey-calavi",
        from: "from-purple-600",
        to: "to-purple-900",
    },
    {
        name: "Ouidah",
        slug: "ouidah",
        from: "from-red-600",
        to: "to-red-900",
    },
    {
        name: "Abomey",
        slug: "abomey",
        from: "from-amber-500",
        to: "to-amber-800",
    },
] as const;

export default async function CitiesSection() {
    const upcomingEvents = await prisma.event.findMany({
        where: {
            startDate: { gte: new Date() },
            location: { not: null },
        },
        select: { location: true },
    });

    const citiesWithCount = CITIES.map((city) => ({
        ...city,
        count: upcomingEvents.filter((e) =>
            e.location?.toLowerCase().includes(city.name.toLowerCase()),
        ).length,
    }));

    return (
        <section className="py-14 border-t bg-muted/40">
            <div className="max-w-6xl mx-auto px-6 md:px-12">
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-secondary" />
                        <span className="text-secondary text-xs font-bold uppercase tracking-widest">
                            Destinations
                        </span>
                    </div>
                    <h2 className="font-afo text-4xl md:text-5xl">
                        Évènements par ville
                    </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    {citiesWithCount.map((city) => (
                        <Link
                            key={city.slug}
                            href={`/events?q=${city.name}`}
                            className="group"
                        >
                            <div
                                className={`relative h-36 md:h-44 rounded-2xl overflow-hidden bg-linear-to-br ${city.from} ${city.to}`}
                            >
                                {/* Grid pattern */}
                                <div
                                    className="absolute inset-0 opacity-[0.08]"
                                    style={{
                                        backgroundImage:
                                            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                                        backgroundSize: "16px 16px",
                                    }}
                                />
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                                {/* Gradient bottom */}
                                <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
                                {/* Content */}
                                <div className="absolute inset-0 flex flex-col justify-end p-3.5">
                                    <span className="font-afo text-3xl text-white leading-tight">
                                        {city.name}
                                    </span>
                                    <span className="text-white/60 text-xs mt-0.5">
                                        {city.count > 0
                                            ? `${city.count} évènement${city.count > 1 ? "s" : ""}`
                                            : "Bientôt"}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
