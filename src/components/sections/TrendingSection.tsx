import prisma from "@/lib/prisma";
import Link from "next/link";
import { TrendingUp, ArrowRight } from "lucide-react";
import EventCard, { type EventForCard } from "@/app/events/event-card";

export default async function TrendingSection() {
    const events = await prisma.event.findMany({
        where: { startDate: { gte: new Date() }, isDeleted: false, isCancelled: false },
        orderBy: { likes: { _count: "desc" } },
        take: 6,
        include: {
            organizer: { select: { name: true } },
            tickets: {
                select: { price: true },
                orderBy: { price: "asc" },
                take: 1,
            },
            categories: {
                include: {
                    category: { select: { name: true, slug: true } },
                },
            },
            _count: { select: { likes: true, favorites: true } },
        },
    });

    if (!events.length) return null;

    return (
        <section className="py-14 border-t bg-background">
            <div className="max-w-6xl mx-auto px-6 md:px-12">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-secondary" />
                            <span className="text-secondary text-xs font-bold uppercase tracking-widest">
                                Populaires
                            </span>
                        </div>
                        <h2 className="font-afo text-4xl md:text-5xl">
                            Tendances du moment
                        </h2>
                    </div>
                    <Link
                        href="/events?sort=popular"
                        className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-secondary hover:gap-3 transition-all duration-200 shrink-0"
                    >
                        Voir tous <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {events.map((event) => (
                        <EventCard
                            key={event.id}
                            event={event as unknown as EventForCard}
                            view="grid"
                        />
                    ))}
                </div>

                <div className="mt-6 flex md:hidden">
                    <Link
                        href="/events?sort=popular"
                        className="flex items-center gap-1.5 text-sm font-semibold text-secondary"
                    >
                        Voir les évènements populaires{" "}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
