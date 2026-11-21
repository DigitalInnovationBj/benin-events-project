import { put } from "@vercel/blob";
import type { PrismaClient } from "@prisma/client";

/**
 * Migration des fichiers de l'ancien Vercel Blob store vers le store du
 * projet (compte Digital Innovation). Utilisé par
 * scripts/migrate-blob-store.ts ; la migration de novembre 2026 est passée
 * par une route admin temporaire, retirée depuis.
 *
 * Colonnes : Event.imageUrl, Event.ogImage, Ticket.imageUrl,
 * Ticket.printFrontUrl, User.image. Idempotent (les adresses déjà sur le
 * nouveau store sont ignorées), ne supprime rien sur l'ancien store, laisse
 * intacte la ligne d'un fichier introuvable.
 */

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

type Ref = { model: "event" | "ticket" | "user"; id: string; field: string; label: string };

export type BlobMigrationReport = {
    apply: boolean;
    newStore: string;
    /** Fichiers encore sur l'ancien store avant ce passage. */
    pending: number;
    /** Fichiers traités dans ce passage (copiés, ou listés en aperçu). */
    files: { pathname: string; usedBy: string[]; status: "à copier" | "copié" | "échec"; error?: string }[];
    copied: number;
    rowsUpdated: number;
    failed: number;
    /** Fichiers restant à traiter après ce passage. */
    remaining: number;
};

/** Hôte du store, déduit du token (vercel_blob_rw_<storeId>_<secret>). */
export function blobStoreHost(token: string): string {
    const storeId = token.match(/^vercel_blob_rw_([a-z0-9]+)_/i)?.[1];
    if (!storeId) throw new Error("Le token ne ressemble pas à un token Vercel Blob.");
    return `${storeId.toLowerCase()}${BLOB_HOST_SUFFIX}`;
}

export async function migrateBlobs(
    prisma: PrismaClient,
    { token, apply, limit = 50 }: { token: string; apply: boolean; limit?: number },
): Promise<BlobMigrationReport> {
    const host = blobStoreHost(token);
    const isOld = (url: string | null): url is string => {
        if (!url) return false;
        try {
            const h = new URL(url).hostname;
            return h.endsWith(BLOB_HOST_SUFFIX) && h !== host;
        } catch {
            return false;
        }
    };

    const [events, tickets, users] = await Promise.all([
        prisma.event.findMany({ select: { id: true, title: true, imageUrl: true, ogImage: true } }),
        prisma.ticket.findMany({ select: { id: true, title: true, imageUrl: true, printFrontUrl: true } }),
        prisma.user.findMany({ select: { id: true, email: true, image: true } }),
    ]);

    // Ancienne adresse → lignes qui l'utilisent (une copie par fichier).
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

    const entries = [...refs.entries()];
    const batch = entries.slice(0, Math.max(1, limit));
    const report: BlobMigrationReport = {
        apply,
        newStore: host,
        pending: entries.length,
        files: [],
        copied: 0,
        rowsUpdated: 0,
        failed: 0,
        remaining: entries.length,
    };

    for (const [oldUrl, rows] of apply ? batch : entries) {
        const pathname = decodeURIComponent(new URL(oldUrl).pathname.replace(/^\//, ""));
        const usedBy = rows.map((r) => r.label);
        if (!apply) {
            report.files.push({ pathname, usedBy, status: "à copier" });
            continue;
        }
        try {
            const res = await fetch(oldUrl, { signal: AbortSignal.timeout(30_000) });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const contentType = res.headers.get("content-type") ?? undefined;
            const body = Buffer.from(await res.arrayBuffer());

            const blob = await put(pathname, body, {
                access: "public",
                token,
                contentType,
                addRandomSuffix: false,
                allowOverwrite: true,
            });
            report.copied++;

            for (const r of rows) {
                const data = { [r.field]: blob.url };
                if (r.model === "event") await prisma.event.update({ where: { id: r.id }, data });
                else if (r.model === "ticket") await prisma.ticket.update({ where: { id: r.id }, data });
                else await prisma.user.update({ where: { id: r.id }, data });
                report.rowsUpdated++;
            }
            report.files.push({ pathname, usedBy, status: "copié" });
        } catch (err) {
            report.failed++;
            report.files.push({ pathname, usedBy, status: "échec", error: (err as Error).message });
        }
    }

    // Les échecs restent sur l'ancienne adresse : ils comptent encore.
    report.remaining = apply ? entries.length - report.copied : entries.length;
    return report;
}
