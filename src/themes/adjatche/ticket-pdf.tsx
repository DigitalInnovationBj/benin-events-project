import React from "react";
import path from "path";
import { Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { ADJATCHE } from "./config";

/**
 * Billet PDF Adjatchè : même format (595 × 210) et même découpage que les
 * billets Benin Events — infos à gauche, pointillés, talon QR à droite.
 */

const asset = (file: string) =>
    path.join(process.cwd(), "src/assets/tickets/adjatche", file);
const font = (file: string) => path.join(process.cwd(), "src/app/fonts", file);

Font.register({ family: "AdjImpact", src: font("Impact.ttf") });
Font.register({
    family: "AdjGotham",
    fonts: [
        { src: font("Gotham-Book.otf"), fontWeight: 400 },
        { src: font("Gotham-Bold.ttf"), fontWeight: 700 },
    ],
});

const C = ADJATCHE.colors;

const s = StyleSheet.create({
    page: { flexDirection: "row", width: 595, height: 210, fontFamily: "AdjGotham" },
    left: { flex: 1, position: "relative", overflow: "hidden", backgroundColor: C.navy },
    bg: { position: "absolute", top: 0, left: 0, width: 440, height: 550 },
    statue: { position: "absolute", left: 2, bottom: 0, height: 200 },
    tour: { position: "absolute", right: 4, bottom: 0, height: 118 },
    hut: { position: "absolute", right: 62, top: -14, height: 100, transform: "rotate(180deg)" },
    center: { position: "absolute", left: 100, right: 96, top: 14, alignItems: "center" },
    logo: { width: 176 },
    dates: { marginTop: 5, flexDirection: "row", alignItems: "flex-end" },
    dBig: { fontFamily: "AdjImpact", fontSize: 19, color: "#ffffff" },
    dSmall: { fontFamily: "AdjImpact", fontSize: 11, color: C.orange, marginHorizontal: 3, marginBottom: 2 },
    pill: { marginTop: 6, backgroundColor: C.orange, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
    pillText: { color: "#ffffff", fontSize: 9, fontWeight: 700 },
    band: {
        position: "absolute", left: 0, right: 0, bottom: 0, height: 42,
        backgroundColor: "rgba(7,18,64,0.82)", flexDirection: "row",
        alignItems: "center", justifyContent: "space-between", paddingLeft: 100, paddingRight: 92,
    },
    label: { fontSize: 6.5, fontWeight: 700, color: "#aab4e6", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2 },
    type: { fontFamily: "AdjImpact", fontSize: 12, color: "#ffffff", textTransform: "uppercase" },
    validity: { fontSize: 7.5, color: "#ffd2a8", marginTop: 1 },
    badge: { backgroundColor: C.orange, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { color: "#ffffff", fontSize: 8, fontWeight: 700 },
    divider: { width: 0, borderLeftWidth: 2, borderLeftStyle: "dashed", borderLeftColor: C.navy },
    right: { width: 158, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", paddingVertical: 8 },
    price: { fontFamily: "AdjImpact", fontSize: 28, color: C.navy, lineHeight: 1 },
    qr: { width: 92, height: 92, marginTop: 4 },
    scan: { fontSize: 6.5, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: 1, marginTop: 3 },
    ref: { fontSize: 6.5, color: C.ink, marginTop: 2 },
    orgs: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
    be: { fontSize: 5.5, color: C.ink, marginTop: 4 },
    beName: { fontFamily: "Afolkalips", fontSize: 7, color: "#3B0458" },
});

/** Prix au format de l'affiche : 2K, 3,5K, 20K. */
function shortPrice(price: number) {
    if (price === 0) return "GRATUIT";
    if (price < 1000) return `${price} F`;
    return `${(price / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}K`;
}

export function AdjatcheTicketPage({
    ticketTitle,
    validity,
    price,
    orderReference,
    ticketIndex,
    ticketTotal,
    qrDataUri,
}: {
    ticketTitle: string;
    validity: string | null;
    price: number;
    orderReference: string;
    ticketIndex: number;
    ticketTotal: number;
    qrDataUri: string;
}) {
    const { from, to, month, year } = ADJATCHE.dates;

    /* eslint-disable jsx-a11y/alt-text -- Image de @react-pdf/renderer, ne supporte pas alt */
    return (
        <Page size={[595, 210]} style={s.page}>
            <View style={s.left}>
                <Image src={asset("bg.jpg")} style={s.bg} />
                <Image src={asset("case.png")} style={s.hut} />
                <View style={s.center}>
                    <Image src={asset("logo.png")} style={s.logo} />
                    <View style={s.dates}>
                        <Text style={s.dSmall}>DU</Text>
                        <Text style={s.dBig}>{from}</Text>
                        <Text style={s.dSmall}>AU</Text>
                        <Text style={s.dBig}>{to}</Text>
                        <Text style={[s.dSmall, { color: "#ffffff" }]}>{month}</Text>
                        <Text style={s.dBig}>{year}</Text>
                    </View>
                    <View style={s.pill}>
                        <Text style={s.pillText}>{ADJATCHE.venue}</Text>
                    </View>
                </View>
                <View style={s.band}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={s.label}>Type de billet</Text>
                        <Text style={s.type}>{ticketTitle}</Text>
                        {validity && <Text style={s.validity}>{validity}</Text>}
                    </View>
                    <View style={s.badge}>
                        <Text style={s.badgeText}>
                            Billet {ticketIndex} / {ticketTotal}
                        </Text>
                    </View>
                </View>
                {/* Visuels au premier plan, par-dessus le bandeau */}
                <Image src={asset("statue.png")} style={s.statue} />
                <Image src={asset("tour.png")} style={s.tour} />
            </View>

            <View style={s.divider} />

            <View style={s.right}>
                <Text style={s.price}>{shortPrice(price)}</Text>
                <Image src={qrDataUri} style={s.qr} />
                <Text style={s.scan}>Scanner à l&apos;entrée</Text>
                <Text style={s.ref}>Réf. {orderReference}</Text>
                <View style={s.orgs}>
                    {ADJATCHE.coorganizers.map((o) => (
                        <Image key={o.name} src={asset(o.pdf)} style={{ height: o.pdfHeight }} />
                    ))}
                </View>
                <Text style={s.be}>
                    Billetterie <Text style={s.beName}>Benin Events</Text>
                </Text>
            </View>
        </Page>
    );
    /* eslint-enable jsx-a11y/alt-text */
}
