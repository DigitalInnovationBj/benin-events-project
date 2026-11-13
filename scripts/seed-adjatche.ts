/**
 * Seed de l'Adjatchè Urban Festival (18–20 déc. 2026, Porto-Novo).
 *
 * Crée deux évènements et leurs billets :
 *   1. « Adjatchè Urban Festival » — l'évènement public, avec 4 pass.
 *   2. « … — Conférences » (18 déc.) — évènement non publié : il sert de point
 *      de scan dédié aux conférences. Le pass VVIP y donne accès avec son
 *      propre QR code (`Ticket.alsoValidForEventId`).
 *
 * Prérequis :
 *   - migration `multi_day_tickets` appliquée (`pnpm db:deploy`) puis
 *     `pnpm prisma generate` ;
 *   - catégories créées (`pnpm db:seed`) — sinon l'évènement est créé sans ;
 *   - un compte ORGANIZER ou ADMIN existant : par défaut celui de
 *     l'organisation (email du dossier de présentation), ou celui désigné par
 *     SEED_ORGANIZER_EMAIL.
 *
 * Usage :
 *   pnpm exec tsx scripts/seed-adjatche.ts
 *
 * Idempotent : évènements retrouvés par leur slug, billets par leur titre
 * dans l'évènement ; une relance met à jour au lieu de dupliquer. Nécessite
 * DATABASE_URL dans .env.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { buildSearchText } from "../src/lib/search";
import { deriveCitySlug } from "../src/lib/cities";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const LOCATION = "Albarika, Porto-Novo";

/** Email de contact de l'organisation (dossier de présentation du festival). */
const DEFAULT_ORGANIZER_EMAIL = "contact.adjatcheurbanfesti@gmail.com";

const FESTIVAL_SLUG = "adjatche-urban-festival";
const CONFERENCES_SLUG = "adjatche-urban-festival-conferences";

const DAY_1 = "2026-12-18";
const DAY_2 = "2026-12-19";
const DAY_3 = "2026-12-20";

const FESTIVAL_DESCRIPTION = `
<p><strong>L'Adjatchè Urban Festival</strong> est le grand rendez-vous des cultures urbaines à Porto-Novo, les 18, 19 et 20 décembre 2026. Thème : <strong>Racine &amp; Modernité</strong>.</p>
<p>Pendant trois jours : conférences, écotourisme, concerts et DJ sets, village gastronomique, défilé de mode, stands, expositions d'art et de photographies, et une Soirée Hommage avec les distinctions Adjatchè.</p>
<h3>Programme</h3>
<p><strong>Vendredi 18 décembre</strong></p>
<ul>
<li>09h00 — Cérémonie de lancement</li>
<li>10h00 — Conférence 1 : Culture et patrimoine</li>
<li>11h30 — Conférence 2 : Jeunesse et entrepreneuriat créatif</li>
<li>16h00 — Écotourisme</li>
</ul>
<p><strong>Samedi 19 décembre</strong></p>
<ul>
<li>09h00 — Exposition d'art « Les mémoires d'Adjatchè »</li>
<li>15h00 — Village gastronomique</li>
<li>18h00 — Défilé de mode, graffiti, concert et show DJ</li>
</ul>
<p><strong>Dimanche 20 décembre</strong></p>
<ul>
<li>09h00 — Exposition d'art</li>
<li>15h00 — Village gastronomique</li>
<li>18h00 — Concert, distinctions (Soirée Hommage) et show DJ</li>
</ul>
<p><em>Programme susceptible d'évoluer. Line-up complet dévoilé progressivement.</em></p>
<p>Plus d'infos : +229 01 47 43 43 36</p>
`.trim();

const CONFERENCES_DESCRIPTION = `
<p>Les deux conférences du vendredi 18 décembre, ouvertes à un nombre réduit de participants :</p>
<ul>
<li>10h00 — Conférence 1 : Culture et patrimoine</li>
<li>11h30 — Conférence 2 : Jeunesse et entrepreneuriat créatif</li>
</ul>
<p>Accès avec le pass VVIP de l'Adjatchè Urban Festival.</p>
`.trim();

const POST_PURCHASE_MESSAGE =
    "<p>Présentez le QR code de votre billet (sur téléphone ou imprimé) à l'entrée. " +
    "Les passes valables plusieurs jours sont scannés une fois par jour. " +
    "Plus d'infos : +229 01 47 43 43 36.</p>";

/** Catégories existantes à rattacher au festival (créées par `pnpm db:seed`). */
const FESTIVAL_CATEGORY_SLUGS = ["festival", "culture-arts", "musique-concert"];
const CONFERENCES_CATEGORY_SLUGS = ["conference-seminaire"];

async function categoryIds(slugs: string[]): Promise<string[]> {
    const found = await prisma.category.findMany({
        where: { slug: { in: slugs } },
        select: { id: true, slug: true },
    });
    const missing = slugs.filter((s) => !found.some((c) => c.slug === s));
    if (missing.length > 0) {
        console.warn(
            `  ⚠️  Catégorie(s) introuvable(s), ignorée(s) : ${missing.join(", ")} (lancez d'abord pnpm db:seed)`,
        );
    }
    return found.map((c) => c.id);
}

type EventInput = {
    slug: string;
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    isPublished: boolean;
    categorySlugs: string[];
};

async function upsertEvent(organizerId: string, input: EventInput) {
    const data = {
        title: input.title,
        description: input.description,
        eventType: "IN_PERSON" as const,
        location: LOCATION,
        city: deriveCitySlug(LOCATION),
        searchText: buildSearchText(input.title, input.description, LOCATION),
        postPurchaseMessage: POST_PURCHASE_MESSAGE,
        startDate: input.startDate,
        endDate: input.endDate,
        ogTitle: input.title,
        isPublished: input.isPublished,
    };

    const existing = await prisma.event.findUnique({
        where: { slug: input.slug },
        select: { id: true },
    });

    const event = existing
        ? await prisma.event.update({ where: { id: existing.id }, data })
        : await prisma.event.create({
              data: { ...data, slug: input.slug, organizerId },
          });

    const ids = await categoryIds(input.categorySlugs);
    for (const categoryId of ids) {
        await prisma.eventCategory.upsert({
            where: { eventId_categoryId: { eventId: event.id, categoryId } },
            update: {},
            create: { eventId: event.id, categoryId },
        });
    }

    console.log(`  ${existing ? "♻️  Mis à jour" : "✅ Créé"} — ${event.title}`);
    return event;
}

type TicketInput = {
    title: string;
    description: string;
    price: number;
    validDays?: string[];
    alsoValidForEventId?: string;
};

async function upsertTicket(eventId: string, input: TicketInput) {
    const data = {
        description: input.description,
        price: input.price,
        validDays: input.validDays ?? [],
        alsoValidForEventId: input.alsoValidForEventId ?? null,
    };

    const existing = await prisma.ticket.findFirst({
        where: { eventId, title: input.title },
        select: { id: true },
    });

    if (existing) {
        await prisma.ticket.update({ where: { id: existing.id }, data });
    } else {
        await prisma.ticket.create({
            data: { ...data, title: input.title, eventId },
        });
    }
    console.log(
        `    ${existing ? "♻️ " : "✅"} ${input.title} — ${input.price.toLocaleString("fr-FR")} FCFA`,
    );
}

async function main() {
    const email = (
        process.env.SEED_ORGANIZER_EMAIL ?? DEFAULT_ORGANIZER_EMAIL
    )
        .trim()
        .toLowerCase();

    const organizer = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true, email: true },
    });
    if (!organizer) {
        throw new Error(
            `Aucun compte avec l'email ${email} : créez-le d'abord (inscription sur le site), puis passez-le en ORGANIZER.`,
        );
    }
    if (organizer.role !== "ORGANIZER" && organizer.role !== "ADMIN") {
        throw new Error(
            `Le compte ${email} n'est pas ORGANIZER ni ADMIN (rôle : ${organizer.role}).`,
        );
    }

    console.log("🌱 Seed Adjatchè Urban Festival\n");

    // Dates saisies à l'heure du Bénin (UTC+1, sans heure d'été).
    const conferences = await upsertEvent(organizer.id, {
        slug: CONFERENCES_SLUG,
        title: "Adjatchè Urban Festival — Conférences",
        description: CONFERENCES_DESCRIPTION,
        startDate: new Date(`${DAY_1}T10:00:00+01:00`),
        endDate: new Date(`${DAY_1}T13:00:00+01:00`),
        isPublished: false, // point de scan uniquement, non vendu au public
        categorySlugs: CONFERENCES_CATEGORY_SLUGS,
    });

    const festival = await upsertEvent(organizer.id, {
        slug: FESTIVAL_SLUG,
        title: "Adjatchè Urban Festival",
        description: FESTIVAL_DESCRIPTION,
        startDate: new Date(`${DAY_1}T09:00:00+01:00`),
        endDate: new Date(`${DAY_3}T23:59:00+01:00`),
        isPublished: true,
        categorySlugs: FESTIVAL_CATEGORY_SLUGS,
    });

    console.log("\n  Billets :");
    await upsertTicket(festival.id, {
        title: "Pass Standard 1 jour",
        description: "Accès au festival pour une journée au choix, une seule entrée.",
        price: 2000,
    });
    await upsertTicket(festival.id, {
        title: "Pass Standard 2 jours",
        description: "Accès au festival les samedi 19 et dimanche 20 décembre.",
        price: 3500,
        validDays: [DAY_2, DAY_3],
    });
    await upsertTicket(festival.id, {
        title: "Pass VIP 1 jour",
        description: "Accès VIP au festival pour une journée au choix, une seule entrée.",
        price: 5000,
    });
    await upsertTicket(festival.id, {
        title: "Pass VVIP — All access",
        description:
            "Accès aux 3 jours du festival, y compris les conférences du vendredi 18 décembre (places limitées).",
        price: 20000,
        validDays: [DAY_1, DAY_2, DAY_3],
        alsoValidForEventId: conferences.id,
    });

    console.log("\n✨ Seed terminé !");
}

main()
    .catch((e) => {
        console.error("❌ Erreur lors du seed :", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
