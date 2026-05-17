import path from "path";
import {
    Document,
    Font,
    Image,
    Page,
    StyleSheet,
    Text,
    View,
    renderToBuffer,
} from "@react-pdf/renderer";

// ─────────────────────────────────────────────
// Polices — enregistrées une seule fois au module load
// ─────────────────────────────────────────────

Font.register({
    family: "Afolkalips",
    src: path.join(process.cwd(), "src/app/fonts/Afolkalips.otf"),
});

Font.register({
    family: "SpaceGrotesk",
    fonts: [
        {
            src: path.join(process.cwd(), "src/app/fonts/SpaceGrotesk-Regular.ttf"),
            fontWeight: 400,
        },
        {
            src: path.join(process.cwd(), "src/app/fonts/SpaceGrotesk-Bold.ttf"),
            fontWeight: 700,
        },
    ],
});

// ─────────────────────────────────────────────
// Tokens de la charte graphique Bénin Events
// ─────────────────────────────────────────────

const BRAND = {
    primary: "#3B0458",       // oklch(0.2763 0.1343 308.9991) → violet profond
    primaryLight: "#F5EEFF",  // tint violet très clair
    secondary: "#FAAD29",     // oklch(0.8024 0.1595 74.5129) → or/ambre
    secondaryLight: "#FFF8E7",// tint or très clair
    white: "#FFFFFF",
    dark: "#111111",
    gray: "#6B7280",
    lightGray: "#F3F4F6",
} as const;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface TicketPdfData {
    eventTitle: string;
    eventDate: string;
    eventLocation: string | null;
    eventType: "IN_PERSON" | "ONLINE";
    ticketTitle: string;
    price: number;
    orderReference: string;
    ticketIndex: number;
    ticketTotal: number;
    qrBuffer: Buffer;
    template: "PRIMARY" | "SECONDARY";
}

// ─────────────────────────────────────────────
// Styles communs
// ─────────────────────────────────────────────

const common = StyleSheet.create({
    page: {
        flexDirection: "row",
        width: 595,
        height: 210,
        fontFamily: "SpaceGrotesk",
    },
    // Bloc gauche — infos événement
    left: {
        flex: 1,
        flexDirection: "column",
    },
    header: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    brandName: {
        fontFamily: "Afolkalips",
        fontSize: 16,
        letterSpacing: 1,
    },
    ticketBadge: {
        fontSize: 9,
        fontWeight: 700,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        fontFamily: "SpaceGrotesk",
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 12,
        justifyContent: "center",
        gap: 6,
    },
    eventTitle: {
        fontFamily: "Afolkalips",
        fontSize: 20,
        lineHeight: 1.2,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    metaLabel: {
        fontSize: 8,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: BRAND.gray,
        width: 40,
    },
    metaValue: {
        fontSize: 10,
        fontWeight: 400,
        flex: 1,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    ticketTypeLabel: {
        fontSize: 8,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: BRAND.gray,
        marginBottom: 2,
    },
    ticketTypeValue: {
        fontSize: 12,
        fontWeight: 700,
    },
    price: {
        fontSize: 20,
        fontWeight: 700,
        textAlign: "right",
    },
    priceLabel: {
        fontSize: 8,
        color: BRAND.gray,
        textAlign: "right",
        marginBottom: 2,
    },
    // Séparateur pointillé vertical
    divider: {
        width: 1,
        marginVertical: 16,
        borderLeftWidth: 2,
        borderLeftStyle: "dashed",
    },
    // Bloc droit — QR code
    right: {
        width: 160,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    qrWrapper: {
        width: 110,
        height: 110,
        padding: 6,
        borderRadius: 8,
        backgroundColor: BRAND.white,
    },
    qrImage: {
        width: "100%",
        height: "100%",
    },
    scanLabel: {
        fontSize: 7,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 1,
        textAlign: "center",
    },
    refText: {
        fontSize: 7,
        textAlign: "center",
        color: BRAND.gray,
        fontFamily: "SpaceGrotesk",
    },
});

// ─────────────────────────────────────────────
// Composant ticket (logique commune, thème injecté)
// ─────────────────────────────────────────────

function TicketDocument({ data, theme }: {
    data: TicketPdfData;
    theme: {
        headerBg: string;
        headerText: string;
        badgeBg: string;
        badgeText: string;
        contentBg: string;
        eventTitleColor: string;
        metaValueColor: string;
        ticketTypeColor: string;
        priceColor: string;
        dividerColor: string;
        rightBg: string;
        scanLabelColor: string;
    };
}) {
    const {
        eventTitle, eventDate, eventLocation, eventType,
        ticketTitle, price, orderReference,
        ticketIndex, ticketTotal, qrBuffer,
    } = data;

    const locationLine = eventType === "IN_PERSON"
        ? (eventLocation ?? "À confirmer")
        : "Événement en ligne";

    const priceLabel = price === 0
        ? "GRATUIT"
        : `${price.toLocaleString("fr-FR")} FCFA`;

    return (
        <Document>
            <Page size={[595, 210]} style={common.page}>

                {/* ── Bloc gauche ───────────────────────────── */}
                <View style={[common.left, { backgroundColor: theme.contentBg }]}>

                    {/* Header coloré */}
                    <View style={[common.header, { backgroundColor: theme.headerBg }]}>
                        <Text style={[common.brandName, { color: theme.headerText }]}>
                            Benin Events
                        </Text>
                        <View style={[common.ticketBadge, {
                            backgroundColor: theme.badgeBg,
                            color: theme.badgeText,
                        }]}>
                            <Text>
                                Billet {ticketIndex} / {ticketTotal}
                            </Text>
                        </View>
                    </View>

                    {/* Infos événement */}
                    <View style={common.content}>
                        <Text style={[common.eventTitle, { color: theme.eventTitleColor }]}>
                            {eventTitle}
                        </Text>

                        <View style={common.metaRow}>
                            <Text style={common.metaLabel}>Date</Text>
                            <Text style={[common.metaValue, { color: theme.metaValueColor }]}>
                                {eventDate}
                            </Text>
                        </View>

                        <View style={common.metaRow}>
                            <Text style={common.metaLabel}>
                                {eventType === "IN_PERSON" ? "Lieu" : "Format"}
                            </Text>
                            <Text style={[common.metaValue, { color: theme.metaValueColor }]}>
                                {locationLine}
                            </Text>
                        </View>
                    </View>

                    {/* Footer : type de billet + prix */}
                    <View style={common.footer}>
                        <View>
                            <Text style={common.ticketTypeLabel}>Type de billet</Text>
                            <Text style={[common.ticketTypeValue, { color: theme.ticketTypeColor }]}>
                                {ticketTitle}
                            </Text>
                        </View>
                        <View>
                            <Text style={common.priceLabel}>Prix</Text>
                            <Text style={[common.price, { color: theme.priceColor }]}>
                                {priceLabel}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ── Séparateur pointillé ──────────────────── */}
                <View style={[common.divider, { borderLeftColor: theme.dividerColor }]} />

                {/* ── Bloc droit — QR ──────────────────────── */}
                <View style={[common.right, { backgroundColor: theme.rightBg }]}>
                    <View style={common.qrWrapper}>
                        <Image
                            style={common.qrImage}
                            src={qrBuffer}
                        />
                    </View>
                    <Text style={[common.scanLabel, { color: theme.scanLabelColor }]}>
                        Scanner à l&apos;entrée
                    </Text>
                    <Text style={common.refText}>
                        Réf. {orderReference}
                    </Text>
                </View>

            </Page>
        </Document>
    );
}

// ─────────────────────────────────────────────
// Thèmes
// ─────────────────────────────────────────────

const themes = {
    PRIMARY: {
        headerBg: BRAND.primary,
        headerText: BRAND.secondary,
        badgeBg: BRAND.secondary,
        badgeText: BRAND.primary,
        contentBg: BRAND.white,
        eventTitleColor: BRAND.primary,
        metaValueColor: BRAND.dark,
        ticketTypeColor: BRAND.primary,
        priceColor: BRAND.secondary,
        dividerColor: BRAND.secondary,
        rightBg: BRAND.primaryLight,
        scanLabelColor: BRAND.primary,
    },
    SECONDARY: {
        headerBg: BRAND.secondary,
        headerText: BRAND.primary,
        badgeBg: BRAND.primary,
        badgeText: BRAND.secondary,
        contentBg: BRAND.white,
        eventTitleColor: BRAND.primary,
        metaValueColor: BRAND.dark,
        ticketTypeColor: BRAND.secondary,
        priceColor: BRAND.primary,
        dividerColor: BRAND.primary,
        rightBg: BRAND.secondaryLight,
        scanLabelColor: BRAND.secondary,
    },
} as const;

// ─────────────────────────────────────────────
// Export public — génère un Buffer PDF
// ─────────────────────────────────────────────

export async function generateTicketPdf(data: TicketPdfData): Promise<Buffer> {
    const theme = themes[data.template];
    const element = <TicketDocument data={data} theme={theme} />;
    return renderToBuffer(element) as Promise<Buffer>;
}
