// app/api/recommendations/route.ts
/*import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma/client.js";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { interest, location, budget, type } = body;

        // Exemple très simple de filtrage basé sur les critères
        // À adapter avec ton modèle de données, et pourquoi pas une IA externe

        const events = await prisma.event.findMany({
            where: {
                AND: [
                    interest
                        ? { title: { contains: interest, mode: "insensitive" } }
                        : {},
                    location
                        ? {
                              OR: [
                                  {
                                      city: {
                                          contains: location,
                                          mode: "insensitive",
                                      },
                                  },
                                  {
                                      country: {
                                          contains: location,
                                          mode: "insensitive",
                                      },
                                  },
                                  {
                                      address: {
                                          contains: location,
                                          mode: "insensitive",
                                      },
                                  },
                              ],
                          }
                        : {},
                    budget ? { price: { lte: Number(budget) } } : {},
                    type
                        ? {
                              category: {
                                  name: { contains: type, mode: "insensitive" },
                              },
                          }
                        : {},
                ],
            },
            orderBy: { date: "asc" },
            select: {
                id: true,
                title: true,
                slug: true,
            },
            take: 10,
        });

        return NextResponse.json(events, { status: 200 });
    } catch (error) {
        console.error("Erreur API /recommendations :", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des recommandations" },
            { status: 500 }
        );
    }
}
    */
