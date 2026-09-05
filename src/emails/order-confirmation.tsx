import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Preview,
    Section,
    Text,
    Row,
    Column,
} from "@react-email/components";
import {
    badge,
    body,
    card,
    container,
    divider,
    footer,
    footerCopyright,
    footerLink,
    footerText,
    h1,
    h2,
    header,
    heroSection,
    infoLabel,
    infoValue,
    innerDivider,
    logo,
    logoSub,
    section,
    subtitle,
    COLORS,
} from "./_theme";
import type { CSSProperties } from "react";

export interface OrderItem {
    id: string;
    ticketTitle: string;
    quantity: number;
    price: number;
    qrCodeDataUrl: string;
}

export interface OrderConfirmationEmailProps {
    customerName: string;
    eventTitle: string;
    eventDate: string;
    eventLocation: string | null;
    eventType: "IN_PERSON" | "ONLINE";
    orderReference: string;
    totalAmount: number;
    items: OrderItem[];
    appUrl: string;
    onlineUrl?: string | null;
    postPurchaseMessage?: string | null;
}

export function OrderConfirmationEmail({
    customerName,
    eventTitle,
    eventDate,
    eventLocation,
    eventType,
    orderReference,
    totalAmount,
    items,
    appUrl,
    onlineUrl,
    postPurchaseMessage,
}: OrderConfirmationEmailProps) {
    const hasAccessInfo = Boolean(onlineUrl || postPurchaseMessage);
    return (
        <Html lang="fr">
            <Head />
            <Preview>Votre commande est confirmée — {eventTitle}</Preview>
            <Body style={body}>
                {/* ── Header ─────────────────────────────────────────── */}
                <Section style={header}>
                    <Container style={{ textAlign: "center" }}>
                        <Text style={logo}>BE</Text>
                        <Text style={logoSub}>Benin Events</Text>
                    </Container>
                </Section>

                <Container style={container}>
                    {/* ── Hero ───────────────────────────────────────── */}
                    <Section style={heroSection}>
                        <Text style={badge("success")}>✓ Commande confirmée</Text>
                        <Heading style={h1}>
                            Vos billets sont prêts !
                        </Heading>
                        <Text style={subtitle}>
                            Bonjour {customerName}, votre paiement a été
                            accepté. Retrouvez vos billets ci-dessous.
                        </Text>
                    </Section>

                    <Hr style={divider} />

                    {/* ── Event info ─────────────────────────────────── */}
                    <Section style={section}>
                        <Heading style={h2}>Détails de l&apos;évènement</Heading>
                        <Section style={card}>
                            <Row>
                                <Column style={infoIcon}>🎪</Column>
                                <Column>
                                    <Text style={infoLabel}>Évènement</Text>
                                    <Text style={infoValue}>{eventTitle}</Text>
                                </Column>
                            </Row>
                            <Row style={{ marginTop: "8px" }}>
                                <Column style={infoIcon}>📅</Column>
                                <Column>
                                    <Text style={infoLabel}>Date</Text>
                                    <Text style={infoValue}>{eventDate}</Text>
                                </Column>
                            </Row>
                            {eventType === "IN_PERSON" && eventLocation && (
                                <Row style={{ marginTop: "8px" }}>
                                    <Column style={infoIcon}>📍</Column>
                                    <Column>
                                        <Text style={infoLabel}>Lieu</Text>
                                        <Text style={infoValue}>
                                            {eventLocation}
                                        </Text>
                                    </Column>
                                </Row>
                            )}
                            {eventType === "ONLINE" && (
                                <Row style={{ marginTop: "8px" }}>
                                    <Column style={infoIcon}>💻</Column>
                                    <Column>
                                        <Text style={infoLabel}>Format</Text>
                                        <Text style={infoValue}>
                                            Événement en ligne
                                        </Text>
                                    </Column>
                                </Row>
                            )}
                        </Section>
                    </Section>

                    {hasAccessInfo && (
                        <>
                            <Hr style={divider} />
                            <Section style={section}>
                                <Heading style={h2}>
                                    {eventType === "ONLINE"
                                        ? "Accès à l'évènement"
                                        : "Informations complémentaires"}
                                </Heading>
                                <Section style={card}>
                                    {onlineUrl && (
                                        <Text style={{ ...infoValue, margin: "0 0 10px" }}>
                                            🔗{" "}
                                            <a href={onlineUrl} style={{ color: COLORS.primary }}>
                                                {onlineUrl}
                                            </a>
                                        </Text>
                                    )}
                                    {postPurchaseMessage && (
                                        <div
                                            style={messageStyle}
                                            dangerouslySetInnerHTML={{
                                                __html: postPurchaseMessage,
                                            }}
                                        />
                                    )}
                                </Section>
                            </Section>
                        </>
                    )}

                    <Hr style={divider} />

                    {/* ── Tickets & QR codes ─────────────────────────── */}
                    <Section style={section}>
                        <Heading style={h2}>Vos billets</Heading>
                        <Text style={qrInstruction}>
                            Présentez chaque QR code à l&apos;entrée pour être
                            admis. Un QR code est valide pour{" "}
                            <strong>une personne</strong>.
                        </Text>

                        {items.map((item, index) => (
                            <Section key={item.id} style={ticketCard}>
                                {/* Ticket header */}
                                <Row>
                                    <Column>
                                        <Text style={ticketBadge}>
                                            🎫 Billet {index + 1} /{" "}
                                            {items.reduce(
                                                (sum, i) => sum + i.quantity,
                                                0,
                                            )}
                                        </Text>
                                    </Column>
                                </Row>

                                {/* Ticket info */}
                                <Row style={{ marginBottom: "16px" }}>
                                    <Column>
                                        <Text style={ticketTitle}>
                                            {item.ticketTitle}
                                        </Text>
                                        <Text style={ticketMeta}>
                                            Quantité : {item.quantity} ×{" "}
                                            {item.price === 0
                                                ? "Gratuit"
                                                : `${item.price.toLocaleString("fr-FR")} FCFA`}
                                        </Text>
                                    </Column>
                                </Row>

                                {/* QR Code centré */}
                                <Row>
                                    <Column style={{ textAlign: "center" }}>
                                        <Img
                                            src={item.qrCodeDataUrl}
                                            width={180}
                                            height={180}
                                            alt={`QR code — ${item.ticketTitle}`}
                                            style={qrCode}
                                        />
                                        <Text style={qrCaption}>
                                            Scanner à l&apos;entrée
                                        </Text>
                                    </Column>
                                </Row>
                            </Section>
                        ))}
                    </Section>

                    <Hr style={divider} />

                    {/* ── Order summary ──────────────────────────────── */}
                    <Section style={section}>
                        <Heading style={h2}>Récapitulatif</Heading>
                        <Section style={card}>
                            <Row>
                                <Column>
                                    <Text style={summaryLabel}>
                                        Référence commande
                                    </Text>
                                </Column>
                                <Column style={{ textAlign: "right" }}>
                                    <Text style={summaryRef}>
                                        {orderReference}
                                    </Text>
                                </Column>
                            </Row>
                            <Hr style={innerDivider} />
                            <Row>
                                <Column>
                                    <Text style={summaryTotal}>
                                        Total payé
                                    </Text>
                                </Column>
                                <Column style={{ textAlign: "right" }}>
                                    <Text style={summaryTotalValue}>
                                        {totalAmount === 0
                                            ? "Gratuit"
                                            : `${totalAmount.toLocaleString("fr-FR")} FCFA`}
                                    </Text>
                                </Column>
                            </Row>
                        </Section>
                    </Section>

                    <Hr style={divider} />

                    {/* ── Footer ─────────────────────────────────────── */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            Besoin d&apos;aide ?{" "}
                            <a href={`${appUrl}/contact`} style={footerLink}>
                                Contactez-nous
                            </a>
                        </Text>
                        <Text style={footerText}>
                            Retrouvez toutes vos commandes sur{" "}
                            <a
                                href={`${appUrl}/dashboard/orders`}
                                style={footerLink}
                            >
                                votre espace
                            </a>
                            .
                        </Text>
                        <Text style={footerCopyright}>
                            © {new Date().getFullYear()} Benin Events. Tous
                            droits réservés.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

// ─────────────────────────────────────────────
// Styles spécifiques à cet email
// ─────────────────────────────────────────────

const infoIcon: CSSProperties = {
    width: "32px",
    fontSize: "18px",
    verticalAlign: "top",
    paddingTop: "2px",
};

const qrInstruction: CSSProperties = {
    color: COLORS.mutedForeground,
    fontSize: "13px",
    margin: "0 0 20px",
    lineHeight: "1.5",
};

const ticketCard: CSSProperties = {
    backgroundColor: COLORS.card,
    border: `2px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "16px",
};

const ticketBadge: CSSProperties = {
    color: COLORS.mutedForeground,
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    margin: "0 0 8px",
};

const ticketTitle: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "18px",
    fontWeight: "700",
    margin: "0 0 4px",
};

const ticketMeta: CSSProperties = {
    color: COLORS.mutedForeground,
    fontSize: "13px",
    margin: 0,
};

const qrCode: CSSProperties = {
    borderRadius: "12px",
    border: `4px solid ${COLORS.primary}`,
    display: "block",
    margin: "0 auto",
};

const qrCaption: CSSProperties = {
    color: COLORS.mutedForeground,
    fontSize: "11px",
    margin: "8px 0 0",
    textAlign: "center",
};

const summaryLabel: CSSProperties = {
    color: COLORS.mutedForeground,
    fontSize: "13px",
    margin: 0,
};

const summaryRef: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "13px",
    fontWeight: "600",
    fontFamily: "monospace",
    margin: 0,
};

const summaryTotal: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "15px",
    fontWeight: "700",
    margin: 0,
};

const summaryTotalValue: CSSProperties = {
    color: COLORS.primary,
    fontSize: "18px",
    fontWeight: "800",
    margin: 0,
};

const messageStyle: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "14px",
    lineHeight: "1.7",
};
