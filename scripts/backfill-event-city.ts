/**
 * Backfill de `Event.city` à partir du texte libre de `Event.location`.
 *
 * À lancer une seule fois, après la migration qui ajoute la colonne :
 *   pnpm exec tsx scripts/backfill-event-city.ts
 *
 * Nécessite DATABASE_URL dans .env.
 *
 * Idempotent : seules les lignes présentielles dont `city` est encore nul sont
 * touchées. Les évènements dont l'adresse ne mentionne aucune ville connue
 * restent à null et sont listés en fin d'exécution, pour que l'organisateur
 * puisse les corriger depuis le formulaire d'édition.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { deriveCitySlug } from "../src/lib/cities";

// Prisma 7 exige un driver adapter (même pattern que scripts/migrate-avatars.ts).
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
    const events = await prisma.event.findMany({
        where: { city: null, eventType: "IN_PERSON", location: { not: null } },
        select: { id: true, title: true, location: true },
    });

    console.log(`${events.length} évènement(s) à traiter.`);

    let updated = 0;
    const unresolved: { title: string; location: string }[] = [];

    for (const event of events) {
        const slug = deriveCitySlug(event.location);
        if (!slug) {
            unresolved.push({
                title: event.title,
                location: event.location ?? "",
            });
            continue;
        }
        await prisma.event.update({
            where: { id: event.id },
            data: { city: slug },
        });
        updated++;
    }

    console.log(`${updated} évènement(s) mis à jour.`);

    if (unresolved.length > 0) {
        console.log(
            `\n${unresolved.length} évènement(s) sans ville reconnue — à renseigner à la main :`,
        );
        for (const e of unresolved) {
            console.log(`  • ${e.title} — « ${e.location} »`);
        }
    }
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
