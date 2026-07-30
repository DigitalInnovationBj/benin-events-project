import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
    Button,
} from "@react-email/components";

export interface EventCancellationEmailProps {
    recipientName: string;
    eventTitle: string;
    eventDate: string;
    orderReference: string;
    totalAmount: number;
    reason?: string;
    appUrl: string;
}

export function EventCancellationEmail({
    recipientName,
    eventTitle,
    eventDate,
    orderReference,
    totalAmount,
    reason,
    appUrl,
}: EventCancellationEmailProps) {
    return (
        <Html lang="fr">
            <Head />
            <Preview>{`« ${eventTitle} » a été annulé — remboursement en cours`}</Preview>
            <Body style={body}>
                <Section style={header}>
                    <Container style={{ textAlign: "center" }}>
                        <Text style={logo}>BE</Text>
                        <Text style={logoSub}>Benin Events</Text>
                    </Container>
                </Section>

                <Container style={container}>
                    <Section style={heroSection}>
                        <Text style={badge}>✗ Évènement annulé</Text>
                        <Heading style={h1}>« {eventTitle} » est annulé</Heading>
                        <Text style={subtitle}>
                            Bonjour {recipientName}, nous vous informons que
                            cet évènement prévu le {eventDate} a été annulé par
                            son organisateur.
                        </Text>
                    </Section>

                    <Hr style={divider} />

                    <Section style={section}>
                        {reason && (
                            <>
                                <Heading style={h2}>Motif</Heading>
                                <Text style={bodyText}>{reason}</Text>
                            </>
                        )}

                        <Heading style={{ ...h2, marginTop: "20px" }}>
                            Votre remboursement
                        </Heading>
                        <Section style={refundBox}>
                            <Text style={refundLine}>
                                <strong>Commande :</strong> {orderReference}
                            </Text>
                            <Text style={refundLine}>
                                <strong>Montant à rembourser :</strong>{" "}
                                {totalAmount.toLocaleString("fr-FR")} FCFA
                            </Text>
                        </Section>
                        <Text style={bodyText}>
                            Le remboursement de votre billet sera traité sous
                            peu vers le moyen de paiement utilisé lors de
                            l&apos;achat. Vous recevrez une confirmation dès
                            que l&apos;opération sera effectuée.
                        </Text>

                        <Section style={{ textAlign: "center", marginTop: "28px" }}>
                            <Button
                                href={`${appUrl}/contact`}
                                style={ctaButton}
                            >
                                Une question ? Contactez-nous
                            </Button>
                        </Section>
                    </Section>

                    <Section style={footer}>
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

const logo: React.CSSProperties = {
    color: "#d4af37",
    fontSize: "28px",
    fontWeight: "900",
    margin: 0,
    letterSpacing: "2px",
    textAlign: "center",
};

const logoSub: React.CSSProperties = {
    color: "#9ca3af",
    fontSize: "11px",
    margin: "2px 0 0",
    letterSpacing: "3px",
    textTransform: "uppercase",
    textAlign: "center",
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

const badge: React.CSSProperties = {
    display: "inline-block",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    fontSize: "13px",
    fontWeight: "700",
    padding: "6px 16px",
    borderRadius: "999px",
    margin: "0 0 20px",
};

const h1: React.CSSProperties = {
    color: "#111827",
    fontSize: "24px",
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
    fontSize: "16px",
    fontWeight: "700",
    margin: "0 0 12px",
};

const bodyText: React.CSSProperties = {
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.7",
    margin: "0 0 12px",
};

const refundBox: React.CSSProperties = {
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    padding: "18px 22px",
    border: "1px solid #e5e7eb",
    marginBottom: "12px",
};

const refundLine: React.CSSProperties = {
    color: "#374151",
    fontSize: "14px",
    margin: "0 0 6px",
};

const ctaButton: React.CSSProperties = {
    backgroundColor: "#000",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "700",
    padding: "14px 28px",
    borderRadius: "8px",
    textDecoration: "none",
    display: "inline-block",
};

const footer: React.CSSProperties = {
    backgroundColor: "#f9fafb",
    padding: "24px 40px",
    textAlign: "center",
};

const footerCopyright: React.CSSProperties = {
    color: "#d1d5db",
    fontSize: "11px",
    margin: 0,
};
