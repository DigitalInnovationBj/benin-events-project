/**
 * Copie les fichiers de l'ancien Vercel Blob store vers le nouveau (compte
 * Digital Innovation) et met à jour leurs adresses en base.
 *
 *   pnpm exec tsx scripts/migrate-blob-store.ts           # aperçu, n'écrit rien
 *   pnpm exec tsx scripts/migrate-blob-store.ts --apply   # copie et met à jour
 *
 * Colonnes traitées : Event.imageUrl, Event.ogImage, Ticket.imageUrl,
 * Ticket.printFrontUrl, User.image.
 *
 * - Toute adresse *.public.blob.vercel-storage.com qui n'est pas sur le
 *   nouveau store est copiée (téléchargement public, aucun accès à l'ancien
 *   compte nécessaire), sous le même chemin, puis remplacée en base.
 * - Une même image utilisée à plusieurs endroits n'est copiée qu'une fois.
 * - Idempotent : les adresses déjà sur le nouveau store sont ignorées ; on
 *   peut le relancer après la bascule pour rattraper les derniers imports.
 * - Une image introuvable est signalée et sa ligne n'est pas modifiée.
 * - Rien n'est supprimé sur l'ancien store.
 *
 * Nécessite dans .env : DATABASE_URL et NEW_BLOB_READ_WRITE_TOKEN (le
 * BLOB_READ_WRITE_TOKEN du nouveau projet Vercel).
 */
import "dotenv/config";
import { put } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const APPLY = process.argv.includes("--apply");
const TOKEN = process.env.NEW_BLOB_READ_WRITE_TOKEN;
const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/** Hôte du nouveau store, déduit du token (vercel_blob_rw_<storeId>_<secret>). */
function newStoreHost(token: string): string {
    const storeId = token.match(/^vercel_blob_rw_([a-z0-9]+)_/i)?.[1];
    if (!storeId) throw new Error("NEW_BLOB_READ_WRITE_TOKEN ne ressemble pas à un token Vercel Blob.");
    return `${storeId.toLowerCase()}${BLOB_HOST_SUFFIX}`;
}

type Ref = { model: "event" | "ticket" | "user"; id: string; field: string; label: string };

async function main() {
    if (!TOKEN) throw new Error("NEW_BLOB_READ_WRITE_TOKEN manquant dans .env.");
    const host = newStoreHost(TOKEN);
    const isOld = (url: string | null): url is string => {
        if (!url) return false;
        try {
            const h = new URL(url).hostname;
            return h.endsWith(BLOB_HOST_SUFFIX) && h !== host;
        } catch {
            return false;
        }
    };

    console.log(`📦 Migration Vercel Blob ${APPLY ? "(APPLICATION)" : "(aperçu, rien n'est écrit)"}`);
    console.log(`   Nouveau store : ${host}\n`);

    const [events, tickets, users] = await Promise.all([
        prisma.event.findMany({ select: { id: true, title: true, imageUrl: true, ogImage: true } }),
        prisma.ticket.findMany({ select: { id: true, title: true, imageUrl: true, printFrontUrl: true } }),
        prisma.user.findMany({ select: { id: true, email: true, image: true } }),
    ]);

    // Ancienne adresse → lignes qui l'utilisent.
    const refs = new Map<string, Ref[]>();
    const add = (url: string | null, ref: Ref) => {
        if (!isOld(url)) return;
        refs.set(url, [...(refs.get(url) ?? []), ref]);
    };
    for (const e of events) {
        add(e.imageUrl, { model: "event", id: e.id, field: "imageUrl", label: `Évènement « ${e.title} » (affiche)` });
        add(e.ogImage, { model: "event", id: e.id, field: "ogImage", label: `Évènement « ${e.title} » (image de partage)` });
    }
    for (const t of tickets) {
        add(t.imageUrl, { model: "ticket", id: t.id, field: "imageUrl", label: `Billet « ${t.title} » (image)` });
        add(t.printFrontUrl, { model: "ticket", id: t.id, field: "printFrontUrl", label: `Billet « ${t.title} » (visuel imprimé)` });
    }
    for (const u of users) {
        add(u.image, { model: "user", id: u.id, field: "image", label: `Profil ${u.email}` });
    }

    const total = [...refs.values()].reduce((n, r) => n + r.length, 0);
    console.log(`${refs.size} fichier(s) à copier, utilisés par ${total} ligne(s).\n`);

    let copied = 0;
    let updated = 0;
    const failed: string[] = [];

    for (const [oldUrl, rows] of refs) {
        const pathname = decodeURIComponent(new URL(oldUrl).pathname.replace(/^\//, ""));
        if (!APPLY) {
            console.log(`  → ${pathname}`);
            for (const r of rows) console.log(`      ${r.label}`);
            continue;
        }
        try {
            const res = await fetch(oldUrl, { signal: AbortSignal.timeout(30_000) });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const contentType = res.headers.get("content-type") ?? undefined;
            const body = Buffer.from(await res.arrayBuffer());

            const blob = await put(pathname, body, {
                access: "public",
                token: TOKEN,
                contentType,
                addRandomSuffix: false,
                allowOverwrite: true,
            });
            copied++;

            for (const r of rows) {
                const data = { [r.field]: blob.url };
                if (r.model === "event") await prisma.event.update({ where: { id: r.id }, data });
                else if (r.model === "ticket") await prisma.ticket.update({ where: { id: r.id }, data });
                else await prisma.user.update({ where: { id: r.id }, data });
                updated++;
            }
            console.log(`  ✔ ${pathname} (${rows.length} ligne${rows.length > 1 ? "s" : ""})`);
        } catch (err) {
            failed.push(`${pathname} — ${(err as Error).message} (${rows.map((r) => r.label).join(" ; ")})`);
            console.error(`  ✗ ${pathname} : ${(err as Error).message}`);
        }
    }

    if (APPLY) {
        console.log(`\n✨ ${copied} fichier(s) copié(s), ${updated} ligne(s) mise(s) à jour.`);
        if (failed.length) {
            console.log(`\n⚠️  ${failed.length} échec(s), lignes laissées sur l'ancienne adresse :`);
            for (const f of failed) console.log(`   - ${f}`);
        }
    } else {
        console.log("\nAperçu terminé. Relancez avec --apply pour copier et mettre à jour.");
    }
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
