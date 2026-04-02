import prisma from "@/lib/prisma";
import FeaturedEventsSlider from "./FeaturedEventsSlider";
import type { EventForCard } from "@/app/events/event-card";

// ─────────────────────────────────────────────
// Server component — fetches featured events
// and delegates rendering to the client slider
// ─────────────────────────────────────────────

export default async function FeaturedEvents() {
    const events = await prisma.event.findMany({
        where: {
            isFeatured: true,
            isDeleted: false,
            startDate: { gte: new Date() },
        },
        orderBy: { startDate: "asc" },
        take: 8,
        include: {
            organizer: {
                select: { name: true },
            },
            tickets: {
                select: { price: true },
                orderBy: { price: "asc" },
                take: 1,
            },
            categories: {
                include: {
                    category: {
                        select: { name: true, slug: true },
                    },
                },
            },
            _count: {
                select: { likes: true, favorites: true },
            },
        },
    });

    // Don't render the section at all when there are no featured events
    if (!events.length) return null;

    return (
        <FeaturedEventsSlider events={events as unknown as EventForCard[]} />
    );
}
