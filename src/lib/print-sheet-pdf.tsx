import React from "react";
import path from "path";
import { readFile } from "fs/promises";
import QRCode from "qrcode";
import {
    Document,
    Font,
    Image,
    Line,
    Page,
    Svg,
    Text,
    View,
    renderToBuffer,
} from "@react-pdf/renderer";
import { printedTicketCode, TICKETS_PER_SHEET } from "@/lib/printed-tickets";

/**
 * PDF d'impression des billets physiques.
 *
 * A4 paysage, 8 billets de 145 × 50 mm (2 colonnes × 4 rangées) jointifs,
 * coupe commune, marges 3,5 mm (côtés) et 5 mm (haut/bas), traits de coupe
 * dans les marges. Chaque feuille recto est suivie de sa feuille verso,
 * retournée gauche-droite (bord court) : le billet de la colonne gauche au
 * recto est dans la colonne droite au verso.
 *
 * Gabarit du graphiste : visuel de 151 × 56 mm (3 mm de fond perdu), talon de
 * 40 mm à droite au recto, carré blanc 34 mm en (108, 3), QR 28 mm en
 * (111, 6), numéro en (110, 40) sur 30 × 6 mm. Au verso, le numéro est en
 * (5, 40), pile derrière celui du recto.
 */

const fontDir = path.join(process.cwd(), "src/app/fonts");
Font.register({ family: "PrintAfo", src: path.join(fontDir, "Afolkalips.otf") });
Font.register({ family: "PrintImpact", src: path.join(fontDir, "Impact.ttf") });
Font.register({
    family: "PrintSG",
    fonts: [
        { src: path.join(fontDir, "SpaceGrotesk-Regular.ttf"), fontWeight: 400 },
        { src: path.join(fontDir, "SpaceGrotesk-Bold.ttf"), fontWeight: 700 },
    ],
});

/** Millimètres → points PDF. */
const mm = (v: number) => (v * 72) / 25.4;

const SHEET = { w: 297, h: 210 };
const TICKET = { w: 145, h: 50 };
const MARGIN = { x: 3.5, y: 5 };

type Palette = {
    main: string;
    mainText: string;
    accent: string;
    talon: string;
    soft: string;
    ink: string;
    titleFont: string;
};

const PALETTES: Record<string, Palette> = {
    default: {
        main: "#3B0458",
        mainText: "#FFFFFF",
        accent: "#FAAD29",
        talon: "#FFF8E7",
        soft: "#F5EEFF",
        ink: "#111111",
        titleFont: "PrintAfo",
    },
    adjatche: {
        main: "#132A88",
        mainText: "#FFFFFF",
        accent: "#EF7D19",
        talon: "#FDF0E3",
        soft: "#EEF1FB",
        ink: "#0B1B5E",
        titleFont: "PrintImpact",
    },
};

export interface PrintSheetData {
    eventTitle: string;
    eventDate: string;
    eventLocation: string | null;
    theme: string | null;
    ticketTitle: string;
    /** Libellé du prix déjà formaté (ex. « 20 000 F CFA »). */
    priceLabel: string;
    validity: string | null;
    frontUrl: string | null;
    backUrl: string | null;
    /** Couleur du numéro imprimé : « dark » (noir) ou « light » (blanc). */
    numberColor?: string;
    appUrl: string;
    items: { id: string; serial: number | null; orderReference: string }[];
}

type Prepared = { code: string; qr: string };

/** Visuel du graphiste illisible : le PDF n'est pas généré. */
export class PrintArtError extends Error {}

/**
 * Charge un visuel (URL Vercel Blob ou chemin local) en data URI. React-PDF
 * ignore en silence une image introuvable : sans ce préchargement, le PDF
 * sortait sans fond, sans aucune alerte.
 */
async function loadArt(src: string, label: string): Promise<string> {
    let bytes: Buffer;
    try {
        if (/^https?:\/\//.test(src)) {
            const res = await fetch(src, { signal: AbortSignal.timeout(20_000) });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            bytes = Buffer.from(await res.arrayBuffer());
        } else {
            bytes = await readFile(src);
        }
    } catch (err) {
        throw new PrintArtError(
            `Le visuel ${label} est inaccessible (${(err as Error).message}). Réessayez, ou renvoyez le visuel.`,
        );
    }
    const isPng = bytes.subarray(0, 4).toString("hex") === "89504e47";
    const isJpg = bytes.subarray(0, 3).toString("hex") === "ffd8ff";
    if (!isPng && !isJpg) {
        throw new PrintArtError(`Le visuel ${label} n'est pas un PNG ou un JPG valide. Renvoyez-le.`);
    }
    return `data:image/${isPng ? "png" : "jpeg"};base64,${bytes.toString("base64")}`;
}

function numberColor(d: PrintSheetData, p: Palette) {
    return d.numberColor === "light" ? "#FFFFFF" : p.ink;
}

function TicketFront({ d, t, p }: { d: PrintSheetData; t: Prepared; p: Palette }) {
    return (
        <>
            {d.frontUrl ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image
                    src={d.frontUrl}
                    style={{ position: "absolute", left: mm(-3), top: mm(-3), width: mm(151), height: mm(56) }}
                />
            ) : (
                <>
                    <View style={{ position: "absolute", left: 0, top: 0, width: mm(105), height: mm(50), backgroundColor: p.main }} />
                    <View style={{ position: "absolute", left: mm(105), top: 0, width: mm(40), height: mm(50), backgroundColor: p.talon }} />
                    <View style={{ position: "absolute", left: mm(6), top: mm(5), width: mm(94), height: mm(40), justifyContent: "space-between" }}>
                        <View>
                            <Text style={{ fontFamily: "PrintSG", fontSize: 6.5, color: p.accent, letterSpacing: 1, textTransform: "uppercase" }}>
                                Benin Events · billet officiel
                            </Text>
                            <Text style={{ fontFamily: p.titleFont, fontSize: 15, color: p.mainText, marginTop: mm(1.5), lineHeight: 1.1 }}>
                                {d.eventTitle}
                            </Text>
                            <Text style={{ fontFamily: "PrintSG", fontSize: 7.5, color: p.mainText, marginTop: mm(1.5), opacity: 0.9 }}>
                                {d.eventDate}{d.eventLocation ? `  ·  ${d.eventLocation}` : ""}
                            </Text>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
                            <View style={{ maxWidth: mm(60) }}>
                                <Text style={{ fontFamily: "PrintSG", fontWeight: 700, fontSize: 11, color: p.accent }}>
                                    {d.ticketTitle}
                                </Text>
                                {d.validity && (
                                    <Text style={{ fontFamily: "PrintSG", fontSize: 6.5, color: p.mainText, marginTop: 1 }}>
                                        {d.validity}
                                    </Text>
                                )}
                            </View>
                            <Text style={{ fontFamily: "PrintSG", fontWeight: 700, fontSize: 12, color: p.mainText }}>
                                {d.priceLabel}
                            </Text>
                        </View>
                    </View>
                </>
            )}
            {/* Carré blanc (marge de silence) + QR */}
            <View style={{ position: "absolute", left: mm(108), top: mm(3), width: mm(34), height: mm(34), backgroundColor: "#FFFFFF" }} />
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={t.qr} style={{ position: "absolute", left: mm(111), top: mm(6), width: mm(28), height: mm(28) }} />
            <Text style={{ position: "absolute", left: mm(110), top: mm(40.6), width: mm(30), textAlign: "center", fontFamily: "PrintSG", fontWeight: 700, fontSize: 8.5, color: numberColor(d, p) }}>
                {t.code}
            </Text>
        </>
    );
}

function TicketBack({ d, t, p }: { d: PrintSheetData; t: Prepared; p: Palette }) {
    return (
        <>
            {d.backUrl ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image
                    src={d.backUrl}
                    style={{ position: "absolute", left: mm(-3), top: mm(-3), width: mm(151), height: mm(56) }}
                />
            ) : (
                <>
                    <View style={{ position: "absolute", left: 0, top: 0, width: mm(145), height: mm(50), backgroundColor: p.soft }} />
                    <View style={{ position: "absolute", left: 0, top: 0, width: mm(40), height: mm(50), backgroundColor: p.talon }} />
                    <View style={{ position: "absolute", left: mm(46), top: mm(6), width: mm(93), height: mm(38), justifyContent: "space-between" }}>
                        <View>
                            <Text style={{ fontFamily: p.titleFont, fontSize: 12, color: p.main }}>
                                {d.eventTitle}
                            </Text>
                            <Text style={{ fontFamily: "PrintSG", fontSize: 7, color: p.ink, marginTop: mm(2), lineHeight: 1.35 }}>
                                Ce billet n&apos;est valable qu&apos;après activation par un point de vente
                                officiel, au moment de l&apos;achat. Il donne droit à une entrée et
                                n&apos;est ni repris ni échangé.
                            </Text>
                        </View>
                        <Text style={{ fontFamily: "PrintSG", fontSize: 6.5, color: p.main }}>
                            Vérifier un billet : scannez le QR au recto · {d.appUrl.replace(/^https?:\/\//, "")}
                        </Text>
                    </View>
                </>
            )}
            <Text style={{ position: "absolute", left: mm(5), top: mm(40.6), width: mm(30), textAlign: "center", fontFamily: "PrintSG", fontWeight: 700, fontSize: 8.5, color: numberColor(d, p) }}>
                {t.code}
            </Text>
        </>
    );
}

/** Traits de coupe dans les marges, dans l'axe de chaque coupe. */
function CropMarks() {
    const xs = [MARGIN.x, MARGIN.x + TICKET.w, MARGIN.x + 2 * TICKET.w];
    const ys = [0, 1, 2, 3, 4].map((i) => MARGIN.y + i * TICKET.h);
    const stroke = { stroke: "#000000", strokeWidth: 0.25 };
    return (
        <Svg width={mm(SHEET.w)} height={mm(SHEET.h)} style={{ position: "absolute", left: 0, top: 0 }}>
            {xs.flatMap((x) => [
                <Line key={`t${x}`} x1={mm(x)} y1={mm(0.5)} x2={mm(x)} y2={mm(4)} {...stroke} />,
                <Line key={`b${x}`} x1={mm(x)} y1={mm(SHEET.h - 4)} x2={mm(x)} y2={mm(SHEET.h - 0.5)} {...stroke} />,
            ])}
            {ys.flatMap((y) => [
                <Line key={`l${y}`} x1={mm(0.3)} y1={mm(y)} x2={mm(2.8)} y2={mm(y)} {...stroke} />,
                <Line key={`r${y}`} x1={mm(SHEET.w - 2.8)} y1={mm(y)} x2={mm(SHEET.w - 0.3)} y2={mm(y)} {...stroke} />,
            ])}
        </Svg>
    );
}

function Sheet({ d, tickets, side, p }: { d: PrintSheetData; tickets: Prepared[]; side: "front" | "back"; p: Palette }) {
    return (
        <Page size={[mm(SHEET.w), mm(SHEET.h)]} style={{ position: "relative", backgroundColor: "#FFFFFF" }}>
            {tickets.map((t, i) => {
                const row = Math.floor(i / 2);
                const col = i % 2;
                const c = side === "front" ? col : 1 - col;
                return (
                    <View
                        key={t.code}
                        style={{
                            position: "absolute",
                            left: mm(MARGIN.x + c * TICKET.w),
                            top: mm(MARGIN.y + row * TICKET.h),
                            width: mm(TICKET.w),
                            height: mm(TICKET.h),
                            overflow: "hidden",
                        }}
                    >
                        {side === "front" ? <TicketFront d={d} t={t} p={p} /> : <TicketBack d={d} t={t} p={p} />}
                    </View>
                );
            })}
            <CropMarks />
        </Page>
    );
}

export async function generatePrintSheetPdf(input: PrintSheetData): Promise<Buffer> {
    const p = PALETTES[input.theme ?? ""] ?? PALETTES.default;

    const [frontUrl, backUrl] = await Promise.all([
        input.frontUrl ? loadArt(input.frontUrl, "recto") : null,
        input.backUrl ? loadArt(input.backUrl, "verso") : null,
    ]);
    const d: PrintSheetData = { ...input, frontUrl, backUrl };

    const prepared: Prepared[] = await Promise.all(
        d.items.map(async (item) => ({
            code: printedTicketCode(d.ticketTitle, item.serial),
            qr: await QRCode.toDataURL(`${d.appUrl}/verify?item=${item.id}&order=${item.orderReference}`, {
                errorCorrectionLevel: "M",
                margin: 0,
                width: 600,
            }),
        })),
    );

    const sheets: Prepared[][] = [];
    for (let i = 0; i < prepared.length; i += TICKETS_PER_SHEET) {
        sheets.push(prepared.slice(i, i + TICKETS_PER_SHEET));
    }

    const doc = (
        <Document title={`Billets ${d.ticketTitle} — ${d.eventTitle}`} author="Benin Events">
            {sheets.flatMap((tickets, i) => [
                <Sheet key={`f${i}`} d={d} tickets={tickets} side="front" p={p} />,
                <Sheet key={`b${i}`} d={d} tickets={tickets} side="back" p={p} />,
            ])}
        </Document>
    );

    return renderToBuffer(doc) as Promise<Buffer>;
}
