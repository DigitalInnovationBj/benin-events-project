/**
 * Copie les avatars hébergés chez Clerk (img.clerk.com) vers Vercel Blob
 * et met à jour User.image. À lancer AVANT la fermeture du compte Clerk :
 *
 *   pnpm exec tsx scripts/migrate-avatars.ts
 *
 * Idempotent : les utilisateurs déjà migrés (URL non-Clerk) sont ignorés.
 * Nécessite BLOB_READ_WRITE_TOKEN et DATABASE_URL dans .env.
 */
import "dotenv/config";
import { put } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const users = await prisma.user.findMany({
        where: { image: { startsWith: "https://img.clerk.com" } },
        select: { id: true, email: true, image: true },
    });

    console.log(`${users.length} avatar(s) Clerk à migrer.`);

    let ok = 0;
    let failed = 0;

    for (const user of users) {
        try {
            const res = await fetch(user.image!);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const contentType =
                res.headers.get("content-type") ?? "image/jpeg";
            const buffer = Buffer.from(await res.arrayBuffer());

            const ext = contentType.includes("png") ? "png" : "jpg";
            const blob = await put(`avatars/${user.id}.${ext}`, buffer, {
                access: "public",
                contentType,
                addRandomSuffix: true,
            });

            await prisma.user.update({
                where: { id: user.id },
                data: { image: blob.url },
            });

            ok++;
            console.log(`✓ ${user.email} → ${blob.url}`);
        } catch (err) {
            failed++;
            console.error(`✗ ${user.email} :`, err);
        }
    }

    console.log(`\nTerminé : ${ok} migré(s), ${failed} échec(s).`);
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
