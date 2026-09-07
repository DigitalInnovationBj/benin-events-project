import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const STATIC_ROUTES: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
}> = [
    { path: "/", changeFrequency: "daily", priority: 1 },
    { path: "/events", changeFrequency: "daily", priority: 0.9 },
    { path: "/devenir-partenaire", changeFrequency: "monthly", priority: 0.5 },
    { path: "/contact", changeFrequency: "yearly", priority: 0.3 },
    { path: "/faq", changeFrequency: "yearly", priority: 0.3 },
    { path: "/cgu", changeFrequency: "yearly", priority: 0.1 },
    { path: "/confidentialite", changeFrequency: "yearly", priority: 0.1 },
    { path: "/cookies", changeFrequency: "yearly", priority: 0.1 },
    { path: "/mentions-legales", changeFrequency: "yearly", priority: 0.1 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const events = await prisma.event.findMany({
        // Les évènements terminés étaient listés : leurs pages existent
        // toujours mais n'ont plus rien à proposer, autant ne pas dépenser le
        // budget d'exploration dessus.
        where: {
            isPublished: true,
            isDeleted: false,
            isCancelled: false,
            endDate: { gte: new Date() },
        },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
    });

    const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
        url: `${APP_URL}${r.path}`,
        lastModified: new Date(),
        changeFrequency: r.changeFrequency,
        priority: r.priority,
    }));

    const eventEntries: MetadataRoute.Sitemap = events.map((event) => ({
        url: `${APP_URL}/events/${event.slug}`,
        lastModified: event.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
    }));

    return [...staticEntries, ...eventEntries];
}
