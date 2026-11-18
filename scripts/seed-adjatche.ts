/**
 * Seed de l'Adjatchè Urban Festival (18–20 déc. 2026, Porto-Novo).
 *
 * Crée l'évènement « Adjatchè Urban Festival », ses billets et les sessions
 * « Conférences » et « Écotourisme » (18 déc.). Les pass all access (VVIP,
 * Soutien) donnent accès aux deux ; le Pass Ecotourisme donne accès à
 * l'écotourisme uniquement. Les agents scannent chaque session à un point de
 * contrôle dédié, avec le même QR code.
 *
 * Pour une base déjà en production, préférer la mise à jour ciblée
 * scripts/adjatche-billets-physiques.ts (ce seed réécrit aussi stocks et
 * descriptions).
 *
 * Supprime l'ancien évènement brouillon « … — Conférences » créé par les
 * premières versions de ce script (ou le masque s'il a des commandes).
 *
 * Prérequis :
 *   - migrations appliquées (`pnpm db:deploy`) puis `pnpm prisma generate` ;
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
/** Ancien évènement brouillon des conférences (remplacé par une session). */
const LEGACY_CONFERENCES_SLUG = "adjatche-urban-festival-conferences";

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



const POST_PURCHASE_MESSAGE =
    "<p>Présentez le QR code de votre billet (sur téléphone ou imprimé) à l'entrée. " +
    "Les passes valables plusieurs jours sont scannés une fois par jour. " +
    "Plus d'infos : +229 01 47 43 43 36.</p>";

/** Catégories existantes à rattacher au festival (créées par `pnpm db:seed`). */
const FESTIVAL_CATEGORY_SLUGS = ["festival", "culture-arts", "musique-concert"];

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
    /** Habillage de la page et des billets (cf. src/themes/registry.ts). */
    theme?: string | null;
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
        theme: input.theme ?? null,
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
    /** Sessions accessibles (absent = accès existants conservés). */
    sessionIds?: string[];
    /** Stock limité (null = illimité). */
    totalStock?: number | null;
    /** Accès à ses sessions uniquement (refusé à l'entrée générale). */
    sessionOnly?: boolean;
    /** Code imprimé des billets physiques (posé seulement s'il n'y en a pas). */
    printCode?: string;
};

async function upsertTicket(eventId: string, input: TicketInput) {
    const data = {
        description: input.description,
        price: input.price,
        validDays: input.validDays ?? [],
        totalStock: input.totalStock ?? null,
        sessionOnly: input.sessionOnly ?? false,
    };
    const sessionLinks = (input.sessionIds ?? []).map((sessionId) => ({ sessionId }));

    const existing = await prisma.ticket.findFirst({
        where: { eventId, title: input.title },
        select: { id: true, printCode: true },
    });

    if (existing) {
        await prisma.ticket.update({
            where: { id: existing.id },
            data: {
                ...data,
                // Un code déjà posé (et peut-être déjà imprimé) n'est jamais changé.
                ...(input.printCode && !existing.printCode ? { printCode: input.printCode } : {}),
                ...(input.sessionIds
                    ? { sessions: { deleteMany: {}, create: sessionLinks } }
                    : {}),
            },
        });
    } else {
        await prisma.ticket.create({
            data: {
                ...data,
                title: input.title,
                eventId,
                printCode: input.printCode,
                sessions: { create: sessionLinks },
            },
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
    const festival = await upsertEvent(organizer.id, {
        slug: FESTIVAL_SLUG,
        title: "Adjatchè Urban Festival",
        description: FESTIVAL_DESCRIPTION,
        startDate: new Date(`${DAY_1}T09:00:00+01:00`),
        endDate: new Date(`${DAY_3}T23:59:00+01:00`),
        isPublished: true,
        categorySlugs: FESTIVAL_CATEGORY_SLUGS,
        theme: "adjatche",
    });

    // Session « Conférences » du vendredi (retrouvée par son nom).
    const existingSession = await prisma.eventSession.findFirst({
        where: { eventId: festival.id, name: "Conférences" },
        select: { id: true },
    });
    const conferences = existingSession
        ? await prisma.eventSession.update({
              where: { id: existingSession.id },
              data: { day: DAY_1 },
          })
        : await prisma.eventSession.create({
              data: { eventId: festival.id, name: "Conférences", day: DAY_1 },
          });
    console.log(`  ${existingSession ? "♻️  Mise à jour" : "✅ Créée"} — session Conférences (${DAY_1})`);

    // Session « Écotourisme » du vendredi.
    const existingEco = await prisma.eventSession.findFirst({
        where: { eventId: festival.id, name: "Écotourisme" },
        select: { id: true },
    });
    const ecotourisme = existingEco
        ? await prisma.eventSession.update({ where: { id: existingEco.id }, data: { day: DAY_1 } })
        : await prisma.eventSession.create({
              data: { eventId: festival.id, name: "Écotourisme", day: DAY_1 },
          });
    console.log(`  ${existingEco ? "♻️  Mise à jour" : "✅ Créée"} — session Écotourisme (${DAY_1})`);

    // Ancien évènement brouillon des conférences : supprimé, ou masqué s'il
    // porte déjà des commandes.
    const legacy = await prisma.event.findUnique({
        where: { slug: LEGACY_CONFERENCES_SLUG },
        select: { id: true, _count: { select: { orders: true } } },
    });
    if (legacy) {
        if (legacy._count.orders > 0) {
            await prisma.event.update({ where: { id: legacy.id }, data: { isDeleted: true } });
            console.log("  🗑️  Ancien évènement « Conférences » masqué (il a des commandes)");
        } else {
            await prisma.event.delete({ where: { id: legacy.id } });
            console.log("  🗑️  Ancien évènement « Conférences » supprimé");
        }
    }

    console.log("\n  Billets :");
    await upsertTicket(festival.id, {
        title: "Pass Ecotourisme",
        description: "Eco découverte touristique pour les étudiants. Donne accès à l'écotourisme uniquement.",
        price: 1500,
        sessionIds: [ecotourisme.id],
        sessionOnly: true,
        printCode: "ECO",
    });
    await upsertTicket(festival.id, {
        title: "Pass Standard 1 jour",
        description: "Accès au festival pour une journée au choix, une seule entrée.",
        price: 2000,
        printCode: "STD-1J",
    });
    await upsertTicket(festival.id, {
        title: "Pass Standard 2 jours",
        description: "Accès au festival les samedi 19 et dimanche 20 décembre.",
        price: 3500,
        validDays: [DAY_2, DAY_3],
        printCode: "STD-2J",
    });
    await upsertTicket(festival.id, {
        title: "Pass VIP 2 jours",
        description: "Accès VIP au festival les samedi 19 et dimanche 20 décembre.",
        price: 10000,
        validDays: [DAY_2, DAY_3],
        printCode: "VIP-2J",
    });
    await upsertTicket(festival.id, {
        title: "Pass VVIP — All access",
        description:
            "Accès aux 3 jours du festival, y compris les conférences et l'écotourisme du vendredi 18 décembre (places limitées).",
        price: 20000,
        validDays: [DAY_1, DAY_2, DAY_3],
        sessionIds: [conferences.id, ecotourisme.id],
        printCode: "VVIP",
    });
    await upsertTicket(festival.id, {
        title: "Pass Soutien — All access",
        description:
            "Soutenir le festival. Accès aux 3 jours du festival, y compris les conférences et l'écotourisme du vendredi 18 décembre (places limitées).",
        price: 50000,
        validDays: [DAY_1, DAY_2, DAY_3],
        sessionIds: [conferences.id, ecotourisme.id],
        printCode: "SOUTIEN",
    });

    // Billet de test des paiements Mobile Money : au minimum FeexPay accepté
    // par l'app (100 FCFA, cf. MIN_AMOUNT_FCFA) et en stock très limité, car
    // il est visible sur la page publique. À supprimer avant la communication.
    await upsertTicket(festival.id, {
        title: "Billet test (ne pas acheter)",
        description: "Billet technique pour tester les paiements. Ne donne pas accès au festival.",
        price: 100,
        totalStock: 5,
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
