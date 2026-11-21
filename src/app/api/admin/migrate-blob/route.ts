import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { migrateBlobs } from "@/lib/blob-migration";

/**
 * TEMPORAIRE — migration des images vers le Blob store du nouveau compte
 * Vercel. À supprimer une fois la migration terminée.
 *
 *   GET /api/admin/migrate-blob            aperçu (rien n'est écrit)
 *   GET /api/admin/migrate-blob?apply=1    copie un lot de 50 fichiers
 *
 * Réservé aux admins. Utilise le BLOB_READ_WRITE_TOKEN du projet.
 */
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
        return NextResponse.json(
            { error: "BLOB_READ_WRITE_TOKEN absent : reliez le Blob store au projet puis redéployez." },
            { status: 500 },
        );
    }

    const apply = req.nextUrl.searchParams.get("apply") === "1";
    const report = await migrateBlobs(prisma, { token, apply, limit: 50 });

    const next =
        apply && report.remaining > 0
            ? `Il reste ${report.remaining} fichier(s) : rechargez cette page.`
            : apply
              ? "Migration terminée."
              : "Aperçu : ajoutez ?apply=1 à l'adresse pour copier.";

    return NextResponse.json({ message: next, ...report }, {
        headers: { "Cache-Control": "no-store" },
    });
}
