/**
 * Backfill de `Event.searchText` pour les évènements existants.
 *
 * À lancer une seule fois, après la migration qui ajoute la colonne :
 *   pnpm prisma migrate dev --name add_event_search_text
 *   pnpm prisma generate      # `migrate dev` ne régénère pas le client ici
 *   pnpm exec tsx scripts/backfill-event-search.ts
 *
 * Sans lui, la recherche ne renvoie rien pour les évènements déjà en base :
 * la colonne est nulle, et c'est elle qui est interrogée.
 *
 * Idempotent : relançable sans effet de bord, il recalcule simplement la même
 * valeur. Nécessite DATABASE_URL dans .env.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { buildSearchText } from "../src/lib/search";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/** Traité par lots : une base volumineuse ne doit pas tenir en mémoire. */
const BATCH_SIZE = 200;

async function main() {
    const total = await prisma.event.count();
    console.log(`${total} évènement(s) à indexer.`);

    let processed = 0;
    let cursor: string | undefined;

    for (;;) {
        const batch = await prisma.event.findMany({
            take: BATCH_SIZE,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
            orderBy: { id: "asc" },
            select: {
                id: true,
                title: true,
                description: true,
                location: true,
                eventType: true,
            },
        });

        if (batch.length === 0) break;

        for (const event of batch) {
            await prisma.event.update({
                where: { id: event.id },
                data: {
                    searchText: buildSearchText(
                        event.title,
                        event.description,
                        event.eventType === "IN_PERSON" ? event.location : null,
                    ),
                },
            });
        }

        processed += batch.length;
        cursor = batch[batch.length - 1].id;
        console.log(`  ${processed}/${total}`);
    }

    console.log("Terminé.");
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
