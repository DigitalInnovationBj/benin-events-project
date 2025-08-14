// app/api/events/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma/client.js"; // adapte le chemin si nécessaire

const prisma = new PrismaClient();

export async function GET() {
    try {
        const events = await prisma.event.findMany({
            include: {
                organizer: {
                    select: { id: true, name: true, email: true }, // champs souhaités
                },
                category: {
                    select: { id: true, name: true },
                },
            },

            orderBy: {
                date: "asc",
            },
        });

        return NextResponse.json(events, { status: 200 });
    } catch (error) {
        console.error("Erreur API GET /api/events:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des événements" },
            { status: 500 }
        );
    }
}
