import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, FunctionCallingMode } from "@google/generative-ai";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(req: NextRequest) {
    // Route publique qui déclenche un appel Gemini : on limite par IP
    // (10 req/min) et globalement (60 req/min) pour protéger le quota.
    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (
        !rateLimit(`ai-search:${ip}`, 10, 60_000) ||
        !rateLimit("ai-search:global", 60, 60_000)
    ) {
        return NextResponse.json(
            { error: "Trop de requêtes. Réessayez dans une minute." },
            { status: 429 },
        );
    }

    const body = await req.json().catch(() => null);
    const query: string = body?.query?.trim();

    if (!query) {
        return NextResponse.json({ error: "Requête manquante" }, { status: 400 });
    }
    if (query.length > 300) {
        return NextResponse.json(
            { error: "Requête trop longue (300 caractères max)." },
            { status: 400 },
        );
    }

    // Upcoming events with their context
    const events = await prisma.event.findMany({
        where: { isDeleted: false, isPublished: true, startDate: { gte: new Date() } },
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

    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        tools: [
            {
                functionDeclarations: [
                    {
                        name: "recommend_events",
                        description: "Retourne les slugs des évènements correspondants et un message explicatif",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                slugs: {
                                    type: SchemaType.ARRAY,
                                    items: { type: SchemaType.STRING },
                                    description: "Slugs des évènements sélectionnés (max 4)",
                                },
                                message: {
                                    type: SchemaType.STRING,
                                    description: "Réponse courte et naturelle en français (1-2 phrases)",
                                },
                            },
                            required: ["slugs", "message"],
                        },
                    },
                ],
            },
        ],
        toolConfig: {
            functionCallingConfig: {
                mode: FunctionCallingMode.ANY,
                allowedFunctionNames: ["recommend_events"],
            },
        },
    });

    const prompt = `Tu es un assistant de recommandation pour Benin Events, une plateforme d'évènements au Bénin (Afrique de l'Ouest).
Tu reçois une liste d'évènements disponibles et une demande utilisateur.
Tu dois sélectionner les évènements les plus pertinents (maximum 4) et expliquer brièvement pourquoi.
Sois précis, chaleureux et en français.

Demande : "${query}"

Évènements disponibles :
${JSON.stringify(eventsForAI, null, 2)}`;

    const result = await model.generateContent(prompt);
    const response = result.response;

    const functionCall = response.candidates?.[0]?.content?.parts
        ?.find((p) => p.functionCall)?.functionCall;

    if (!functionCall) {
        throw new Error("No function call in Gemini response");
    }

    const { slugs, message } = functionCall.args as { slugs: string[]; message: string };

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
