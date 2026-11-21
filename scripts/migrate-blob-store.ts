/**
 * Copie les fichiers de l'ancien Vercel Blob store vers le nouveau et met à
 * jour leurs adresses en base (voir src/lib/blob-migration.ts).
 *
 *   pnpm exec tsx scripts/migrate-blob-store.ts           # aperçu, n'écrit rien
 *   pnpm exec tsx scripts/migrate-blob-store.ts --apply   # copie et met à jour
 *
 * Nécessite dans .env : DATABASE_URL et NEW_BLOB_READ_WRITE_TOKEN (le
 * BLOB_READ_WRITE_TOKEN du nouveau projet Vercel).
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { migrateBlobs } from "../src/lib/blob-migration";

const APPLY = process.argv.includes("--apply");
const TOKEN = process.env.NEW_BLOB_READ_WRITE_TOKEN;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
    if (!TOKEN) throw new Error("NEW_BLOB_READ_WRITE_TOKEN manquant dans .env.");

    console.log(`📦 Migration Vercel Blob ${APPLY ? "(APPLICATION)" : "(aperçu, rien n'est écrit)"}\n`);
    let report;
    do {
        report = await migrateBlobs(prisma, { token: TOKEN, apply: APPLY, limit: 50 });
        if (report.files.length === 0) break;
        for (const f of report.files) {
            const mark = f.status === "copié" ? "✔" : f.status === "échec" ? "✗" : "→";
            console.log(`  ${mark} ${f.pathname}${f.error ? ` — ${f.error}` : ""}`);
            for (const u of f.usedBy) console.log(`      ${u}`);
        }
        // En application, on enchaîne les lots tant qu'il en reste et que le
        // dernier lot a avancé (sinon : uniquement des échecs, on s'arrête).
    } while (APPLY && report.remaining > 0 && report.copied > 0);

    console.log(`\nNouveau store : ${report.newStore}`);
    console.log(APPLY ? `Restant sur l'ancien store : ${report.remaining}` : `${report.pending} fichier(s) à copier. Relancez avec --apply.`);
}

main()
    .catch((e) => {
        console.error("❌", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
