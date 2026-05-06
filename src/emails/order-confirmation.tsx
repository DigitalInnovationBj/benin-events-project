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
}: OrderConfirmationEmailProps) {
    return (
        <Html lang="fr">
            <Head />
            <Preview>Votre commande est confirmée — {eventTitle}</Preview>
            <Body style={body}>
                {/* ── Header ─────────────────────────────────────────── */}
                <Section style={header}>
                    <Container style={headerInner}>
                        <Text style={logo}>BE</Text>
                        <Text style={logoSub}>Benin Events</Text>
                    </Container>
                </Section>

                <Container style={container}>
                    {/* ── Hero ───────────────────────────────────────── */}
                    <Section style={heroSection}>
                        <Text style={successBadge}>✓ Commande confirmée</Text>
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
                        <Section style={infoCard}>
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
                        <Section style={summaryCard}>
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
                            <Hr style={{ margin: "8px 0", borderColor: "#e5e7eb" }} />
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
// Styles
// ─────────────────────────────────────────────

const body: React.CSSProperties = {
    backgroundColor: "#f3f4f6",
    fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0,
    padding: 0,
};

const header: React.CSSProperties = {
    backgroundColor: "#000",
    padding: "20px 0",
};

const headerInner: React.CSSProperties = {
    textAlign: "center",
};

const logo: React.CSSProperties = {
    color: "#d4af37",
    fontSize: "28px",
    fontWeight: "900",
    margin: 0,
    letterSpacing: "2px",
};

const logoSub: React.CSSProperties = {
    color: "#9ca3af",
    fontSize: "11px",
    margin: "2px 0 0",
    letterSpacing: "3px",
    textTransform: "uppercase",
};

const container: React.CSSProperties = {
    backgroundColor: "#ffffff",
    maxWidth: "600px",
    margin: "0 auto",
};

const heroSection: React.CSSProperties = {
    padding: "40px 40px 32px",
    textAlign: "center",
};

const successBadge: React.CSSProperties = {
    display: "inline-block",
    backgroundColor: "#d1fae5",
    color: "#065f46",
    fontSize: "13px",
    fontWeight: "700",
    padding: "6px 16px",
    borderRadius: "999px",
    margin: "0 0 20px",
};

const h1: React.CSSProperties = {
    color: "#111827",
    fontSize: "28px",
    fontWeight: "800",
    margin: "0 0 12px",
    lineHeight: "1.3",
};

const subtitle: React.CSSProperties = {
    color: "#6b7280",
    fontSize: "15px",
    margin: 0,
    lineHeight: "1.6",
};

const divider: React.CSSProperties = {
    borderColor: "#f3f4f6",
    margin: 0,
};

const section: React.CSSProperties = {
    padding: "32px 40px",
};

const h2: React.CSSProperties = {
    color: "#111827",
    fontSize: "18px",
    fontWeight: "700",
    margin: "0 0 16px",
};

const infoCard: React.CSSProperties = {
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid #e5e7eb",
};

const infoIcon: React.CSSProperties = {
    width: "32px",
    fontSize: "18px",
    verticalAlign: "top",
    paddingTop: "2px",
};

const infoLabel: React.CSSProperties = {
    color: "#9ca3af",
    fontSize: "11px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    margin: "0 0 2px",
};

const infoValue: React.CSSProperties = {
    color: "#111827",
    fontSize: "15px",
    fontWeight: "600",
    margin: 0,
};

const qrInstruction: React.CSSProperties = {
    color: "#6b7280",
    fontSize: "13px",
    margin: "0 0 20px",
    lineHeight: "1.5",
};

const ticketCard: React.CSSProperties = {
    backgroundColor: "#fafafa",
    border: "2px solid #e5e7eb",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "16px",
};

const ticketBadge: React.CSSProperties = {
    color: "#6b7280",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    margin: "0 0 8px",
};

const ticketTitle: React.CSSProperties = {
    color: "#111827",
    fontSize: "18px",
    fontWeight: "700",
    margin: "0 0 4px",
};

const ticketMeta: React.CSSProperties = {
    color: "#6b7280",
    fontSize: "13px",
    margin: 0,
};

const qrCode: React.CSSProperties = {
    borderRadius: "12px",
    border: "4px solid #111827",
    display: "block",
    margin: "0 auto",
};

const qrCaption: React.CSSProperties = {
    color: "#9ca3af",
    fontSize: "11px",
    margin: "8px 0 0",
    textAlign: "center",
};

const summaryCard: React.CSSProperties = {
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid #e5e7eb",
};

const summaryLabel: React.CSSProperties = {
    color: "#6b7280",
    fontSize: "13px",
    margin: 0,
};

const summaryRef: React.CSSProperties = {
    color: "#111827",
    fontSize: "13px",
    fontWeight: "600",
    fontFamily: "monospace",
    margin: 0,
};

const summaryTotal: React.CSSProperties = {
    color: "#111827",
    fontSize: "15px",
    fontWeight: "700",
    margin: 0,
};

const summaryTotalValue: React.CSSProperties = {
    color: "#d4af37",
    fontSize: "18px",
    fontWeight: "800",
    margin: 0,
};

const footer: React.CSSProperties = {
    backgroundColor: "#f9fafb",
    padding: "28px 40px",
    textAlign: "center",
};

const footerText: React.CSSProperties = {
    color: "#9ca3af",
    fontSize: "13px",
    margin: "0 0 6px",
};

const footerLink: React.CSSProperties = {
    color: "#d4af37",
    textDecoration: "underline",
};

const footerCopyright: React.CSSProperties = {
    color: "#d1d5db",
    fontSize: "11px",
    margin: "16px 0 0",
};
