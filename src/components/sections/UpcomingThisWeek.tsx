import prisma from "@/lib/prisma";
import UpcomingThisWeekSlider from "./UpcomingThisWeekSlider";
import type { EventForCard } from "@/app/events/event-card";

export default async function UpcomingThisWeek() {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const events = await prisma.event.findMany({
        where: {
            startDate: { gte: now, lte: nextWeek },
        },
        orderBy: { startDate: "asc" },
        take: 10,
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
        <UpcomingThisWeekSlider events={events as unknown as EventForCard[]} />
    );
}
