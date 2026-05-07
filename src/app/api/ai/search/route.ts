import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import prisma from "@/lib/prisma";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const query: string = body?.query?.trim();

    if (!query) {
        return NextResponse.json({ error: "Requête manquante" }, { status: 400 });
    }

    // Upcoming events with their context
    const events = await prisma.event.findMany({
        where: { isDeleted: false, startDate: { gte: new Date() } },
        include: {
            categories: { include: { category: { select: { name: true } } } },
            tickets: { select: { price: true } },
        },
        orderBy: [{ isFeatured: "desc" }, { startDate: "asc" }],
        take: 60,
    });

    if (events.length === 0) {
        return NextResponse.json({
            events: [],
            message: "Aucun évènement à venir pour le moment.",
        });
    }

    const eventsForAI = events.map((e) => {
        const prices = e.tickets.map((t) => t.price);
        return {
            slug: e.slug,
            title: e.title,
            description: e.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 250),
            categories: e.categories.map((ec) => ec.category.name),
            date: e.startDate.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Africa/Porto-Novo",
            }),
            eventType: e.eventType,
            location: e.eventType === "IN_PERSON" ? (e.location ?? "Non précisé") : "En ligne",
            minPrice: prices.length > 0 ? Math.min(...prices) : 0,
            isFeatured: e.isFeatured,
        };
    });

    const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 512,
        system: `Tu es un assistant de recommandation pour Benin Events, une plateforme d'évènements au Bénin (Afrique de l'Ouest).
Tu reçois une liste d'évènements disponibles et une demande utilisateur.
Tu dois sélectionner les évènements les plus pertinents (maximum 4) et expliquer brièvement pourquoi.
Sois précis, chaleureux et en français.`,
        messages: [
            {
                role: "user",
                content: `Demande : "${query}"\n\nÉvènements disponibles :\n${JSON.stringify(eventsForAI, null, 2)}`,
            },
        ],
        tools: [
            {
                name: "recommend_events",
                description: "Retourne les slugs des évènements correspondants et un message explicatif",
                input_schema: {
                    type: "object" as const,
                    properties: {
                        slugs: {
                            type: "array",
                            items: { type: "string" },
                            description: "Slugs des évènements sélectionnés (max 4)",
                        },
                        message: {
                            type: "string",
                            description: "Réponse courte et naturelle en français (1-2 phrases)",
                        },
                    },
                    required: ["slugs", "message"],
                },
            },
        ],
        tool_choice: { type: "tool", name: "recommend_events" },
    });

    // Extract tool result
    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
        throw new Error("No tool_use block in response");
    }

    const { slugs, message } = toolUse.input as { slugs: string[]; message: string };

    // Build result from matching slugs
    const matchingEvents = slugs
        .map((slug) => {
            const e = events.find((ev) => ev.slug === slug);
            if (!e) return null;
            const prices = e.tickets.map((t) => t.price);
            return {
                slug: e.slug,
                title: e.title,
                startDate: e.startDate.toISOString(),
                location: e.location,
                eventType: e.eventType,
                imageUrl: e.imageUrl,
                minPrice: prices.length > 0 ? Math.min(...prices) : 0,
                categories: e.categories.map((ec) => ec.category.name),
            };
        })
        .filter(Boolean);

    return NextResponse.json({ events: matchingEvents, message });
}
