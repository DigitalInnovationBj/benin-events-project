/**
 * Mise à jour ciblée de l'Adjatchè Urban Festival pour les billets physiques
 * et l'écotourisme. À lancer une fois en production, après `pnpm db:deploy`
 * et `pnpm prisma generate`.
 *
 *   - Session « Écotourisme » (vendredi 18 déc.) créée si absente.
 *   - Pass Ecotourisme : accès à l'écotourisme UNIQUEMENT (refusé à l'entrée
 *     générale du festival).
 *   - Pass VVIP et Pass Soutien (all access) : accès à l'écotourisme ajouté,
 *     sans toucher à leurs autres accès ; description complétée.
 *   - Pass VIP : 10 000 F pour 2 jours (samedi 19 et dimanche 20). Si le
 *     « Pass VIP 1 jour » a déjà été acheté, il est retiré de la vente (les
 *     acheteurs gardent leur billet) et un « Pass VIP 2 jours » est créé ;
 *     sinon il est modifié sur place.
 *   - Codes imprimés : ECO, STD-1J, STD-2J, VIP-2J, VVIP, SOUTIEN (seulement
 *     pour les billets qui n'ont pas encore de code).
 *   - Visuels du graphiste (public/print/adjatche/*.jpg) posés sur les billets
 *     qui n'ont pas encore de visuel.
 *
 * Contrairement à seed-adjatche.ts, ne touche à rien d'autre (stocks,
 * autres billets, billet de test…).
 *
 * Usage :
 *   pnpm exec tsx scripts/adjatche-billets-physiques.ts           # aperçu, n'écrit rien
 *   pnpm exec tsx scripts/adjatche-billets-physiques.ts --apply   # applique
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const APPLY = process.argv.includes("--apply");
const FESTIVAL_SLUG = "adjatche-urban-festival";
const DAY_1 = "2026-12-18";
const DAY_2 = "2026-12-19";
const DAY_3 = "2026-12-20";

const T = {
    eco: "Pass Ecotourisme",
    std1: "Pass Standard 1 jour",
    std2: "Pass Standard 2 jours",
    vip1: "Pass VIP 1 jour",
    vip2: "Pass VIP 2 jours",
    vvip: "Pass VVIP — All access",
    soutien: "Pass Soutien — All access",
};

const CODES: Record<string, string> = {
    [T.eco]: "ECO",
    [T.std1]: "STD-1J",
    [T.std2]: "STD-2J",
    [T.vip2]: "VIP-2J",
    [T.vvip]: "VVIP",
    [T.soutien]: "SOUTIEN",
};

/** Visuels du graphiste, livrés avec le site dans public/print/adjatche/. */
const ART: Record<string, string> = {
    [T.eco]: "/print/adjatche/eco.jpg",
    [T.std1]: "/print/adjatche/std-1j.jpg",
    [T.std2]: "/print/adjatche/std-2j.jpg",
    [T.vip2]: "/print/adjatche/vip-2j.jpg",
    [T.vvip]: "/print/adjatche/vvip.jpg",
    [T.soutien]: "/print/adjatche/soutien.jpg",
};

const VIP2_DESCRIPTION = "Accès VIP au festival les samedi 19 et dimanche 20 décembre.";

function log(msg: string) {
    console.log(`${APPLY ? "  ✔" : "  →"} ${msg}`);
}

async function main() {
    console.log(`🎟️  Adjatchè — billets physiques et écotourisme ${APPLY ? "(APPLICATION)" : "(aperçu, rien n'est écrit)"}\n`);

    const event = await prisma.event.findUnique({
        where: { slug: FESTIVAL_SLUG },
        select: {
            id: true,
            tickets: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    position: true,
                    printCode: true,
                    printFrontUrl: true,
                    sessionOnly: true,
                    isArchived: true,
                    sessions: { select: { sessionId: true } },
                },
            },
        },
    });
    if (!event) throw new Error(`Évènement ${FESTIVAL_SLUG} introuvable.`);
    const byTitle = new Map(event.tickets.map((t) => [t.title, t]));

    // ── Session Écotourisme ─────────────────────────────────────────────
    let eco = await prisma.eventSession.findFirst({
        where: { eventId: event.id, name: { in: ["Écotourisme", "Ecotourisme"] } },
        select: { id: true },
    });
    if (eco) {
        console.log("  · Session Écotourisme déjà présente");
    } else {
        log(`Session « Écotourisme » créée (${DAY_1})`);
        if (APPLY) {
            eco = await prisma.eventSession.create({
                data: { eventId: event.id, name: "Écotourisme", day: DAY_1 },
                select: { id: true },
            });
        }
    }
    const ecoId = eco?.id ?? "(nouvelle session)";

    // ── Pass Ecotourisme : écotourisme uniquement ───────────────────────
    const ecoTicket = byTitle.get(T.eco);
    if (!ecoTicket) {
        console.log(`  ⚠️  « ${T.eco} » introuvable : à créer dans le dashboard.`);
    } else if (
        eco &&
        ecoTicket.sessionOnly &&
        ecoTicket.sessions.length === 1 &&
        ecoTicket.sessions[0].sessionId === eco.id
    ) {
        console.log(`  · ${T.eco} : déjà réservé à l'écotourisme`);
    } else {
        log(`${T.eco} : accès Écotourisme uniquement (refusé à l'entrée générale)`);
        if (APPLY && eco) {
            await prisma.ticket.update({
                where: { id: ecoTicket.id },
                data: {
                    sessionOnly: true,
                    validDays: [],
                    sessions: { deleteMany: {}, create: [{ sessionId: eco.id }] },
                },
            });
        }
    }

    // ── All access : + écotourisme ──────────────────────────────────────
    for (const title of [T.vvip, T.soutien]) {
        const t = byTitle.get(title);
        if (!t) {
            console.log(`  ⚠️  « ${title} » introuvable.`);
            continue;
        }
        const has = eco && t.sessions.some((s) => s.sessionId === eco!.id);
        if (has) {
            console.log(`  · ${title} : accès Écotourisme déjà présent`);
        } else {
            log(`${title} : accès Écotourisme ajouté (session ${ecoId})`);
            if (APPLY && eco) {
                await prisma.ticketSession.create({ data: { ticketId: t.id, sessionId: eco.id } });
            }
        }
        const desc = t.description ?? "";
        if (!/[ée]cotourisme/i.test(desc)) {
            const next = desc.includes("y compris les conférences")
                ? desc.replace("y compris les conférences", "y compris les conférences et l'écotourisme")
                : `${desc.trim()} Accès à l'écotourisme inclus.`.trim();
            log(`${title} : description → « ${next} »`);
            if (APPLY) await prisma.ticket.update({ where: { id: t.id }, data: { description: next } });
        }
    }

    // ── Pass VIP : 10 000 F, 2 jours ────────────────────────────────────
    const vip2 = byTitle.get(T.vip2);
    const vip1 = byTitle.get(T.vip1);
    if (vip2) {
        console.log(`  · ${T.vip2} déjà présent`);
    } else if (vip1) {
        const sold = await prisma.orderItem.count({
            where: { ticketId: vip1.id, order: { status: { in: ["COMPLETED", "PENDING", "PRINTED"] } } },
        });
        if (sold > 0) {
            log(`${T.vip1} : ${sold} vente(s) → retiré de la vente (acheteurs conservés) ; « ${T.vip2} » créé à 10 000 F (19 et 20 déc.)`);
            if (APPLY) {
                await prisma.ticket.update({ where: { id: vip1.id }, data: { isArchived: true } });
                await prisma.ticket.create({
                    data: {
                        eventId: event.id,
                        title: T.vip2,
                        description: VIP2_DESCRIPTION,
                        price: 10000,
                        validDays: [DAY_2, DAY_3],
                        position: vip1.position,
                    },
                });
            }
        } else {
            log(`${T.vip1} → « ${T.vip2} », 10 000 F, valable les 19 et 20 déc. (aucune vente)`);
            if (APPLY) {
                await prisma.ticket.update({
                    where: { id: vip1.id },
                    data: { title: T.vip2, description: VIP2_DESCRIPTION, price: 10000, validDays: [DAY_2, DAY_3] },
                });
            }
        }
    } else {
        console.log(`  ⚠️  Ni « ${T.vip1} » ni « ${T.vip2} » : à créer dans le dashboard.`);
    }

    // ── Codes imprimés ──────────────────────────────────────────────────
    const fresh = APPLY
        ? await prisma.ticket.findMany({
              where: { eventId: event.id },
              select: { id: true, title: true, printCode: true, printFrontUrl: true },
          })
        : event.tickets.map((t) => ({
              id: t.id,
              title: t.title === T.vip1 ? T.vip2 : t.title,
              printCode: t.printCode,
              printFrontUrl: t.printFrontUrl,
          }));
    for (const [title, code] of Object.entries(CODES)) {
        const t = fresh.find((x) => x.title === title);
        if (!t) {
            if (!(title === T.vip2 && !APPLY)) console.log(`  ⚠️  « ${title} » introuvable : code ${code} non attribué.`);
            continue;
        }
        if (t.printCode === code) {
            console.log(`  · ${title} : code ${code} déjà en place`);
        } else if (t.printCode) {
            console.log(`  ⚠️  ${title} : code actuel ${t.printCode} conservé (proposé : ${code})`);
        } else {
            log(`${title} : code imprimé ${code}`);
            if (APPLY) await prisma.ticket.update({ where: { id: t.id }, data: { printCode: code } });
        }
    }

    // ── Visuels du graphiste ────────────────────────────────────────────
    for (const [title, url] of Object.entries(ART)) {
        const t = fresh.find((x) => x.title === title);
        if (!t) continue;
        if (t.printFrontUrl === url) {
            console.log(`  · ${title} : visuel déjà en place`);
        } else if (t.printFrontUrl) {
            console.log(`  ⚠️  ${title} : visuel déjà importé conservé`);
        } else {
            log(`${title} : visuel ${url}`);
            if (APPLY) await prisma.ticket.update({ where: { id: t.id }, data: { printFrontUrl: url } });
        }
    }

    console.log(APPLY ? "\n✨ Terminé." : "\nAperçu terminé. Relancez avec --apply pour appliquer.");
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
