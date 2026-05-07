import {
    Body, Container, Head, Heading, Hr, Html,
    Preview, Section, Text, Button,
} from "@react-email/components";

export type PayoutNotifType = "REQUESTED" | "PROCESSING" | "PAID" | "REJECTED";

export interface PayoutNotificationEmailProps {
    organizerName: string;
    type: PayoutNotifType;
    netAmount: number;
    grossAmount: number;
    commissionRate: number;
    adminNote?: string;
    appUrl: string;
}

const CONFIG: Record<PayoutNotifType, { badge: string; badgeStyle: React.CSSProperties; title: string; body: string }> = {
    REQUESTED: {
        badge: "⏳ Demande reçue",
        badgeStyle: { backgroundColor: "#fef9c3", color: "#854d0e" },
        title: "Votre demande de reversement a bien été reçue",
        body: "Nous avons bien reçu votre demande. Elle sera traitée dans les plus brefs délais.",
    },
    PROCESSING: {
        badge: "🔄 En cours",
        badgeStyle: { backgroundColor: "#dbeafe", color: "#1e40af" },
        title: "Votre reversement est en cours de traitement",
        body: "Le virement est en cours. Vous recevrez un email de confirmation dès qu'il sera effectué.",
    },
    PAID: {
        badge: "✅ Reversement effectué",
        badgeStyle: { backgroundColor: "#d1fae5", color: "#065f46" },
        title: "Votre reversement a été effectué !",
        body: "Le montant a été envoyé selon vos coordonnées de paiement enregistrées.",
    },
    REJECTED: {
        badge: "✗ Demande rejetée",
        badgeStyle: { backgroundColor: "#fee2e2", color: "#991b1b" },
        title: "Votre demande de reversement n'a pas abouti",
        body: "Votre demande n'a pas pu être traitée. Contactez le support si vous avez des questions.",
    },
};

export function PayoutNotificationEmail({
    organizerName,
    type,
    netAmount,
    grossAmount,
    commissionRate,
    adminNote,
    appUrl,
}: PayoutNotificationEmailProps) {
    const cfg = CONFIG[type];

    return (
        <Html lang="fr">
            <Head />
            <Preview>{cfg.title}</Preview>
            <Body style={body}>
                <Section style={header}>
                    <Container style={{ textAlign: "center" }}>
                        <Text style={logo}>BE</Text>
                        <Text style={logoSub}>Benin Events</Text>
                    </Container>
                </Section>

                <Container style={container}>
                    <Section style={heroSection}>
                        <Text style={{ ...badge, ...cfg.badgeStyle }}>{cfg.badge}</Text>
                        <Heading style={h1}>{cfg.title}</Heading>
                        <Text style={subtitle}>
                            Bonjour {organizerName}, {cfg.body}
                        </Text>
                    </Section>

                    <Hr style={divider} />

                    <Section style={section}>
                        <Heading style={h2}>Détails du reversement</Heading>
                        <Section style={card}>
                            <Text style={cardRow}>
                                <span style={cardLabel}>Montant net</span>
                                <span style={cardValue}>{netAmount.toLocaleString("fr-FR")} FCFA</span>
                            </Text>
                            <Text style={cardRow}>
                                <span style={cardLabel}>Revenus bruts</span>
                                <span style={cardValue}>{grossAmount.toLocaleString("fr-FR")} FCFA</span>
                            </Text>
                            {commissionRate > 0 && (
                                <Text style={cardRow}>
                                    <span style={cardLabel}>Commission plateforme</span>
                                    <span style={cardValue}>{commissionRate}%</span>
                                </Text>
                            )}
                            {commissionRate === 0 && (
                                <Text style={cardRow}>
                                    <span style={cardLabel}>Commission</span>
                                    <span style={{ ...cardValue, color: "#059669" }}>Offerte (0%)</span>
                                </Text>
                            )}
                        </Section>

                        {adminNote && type === "REJECTED" && (
                            <Section style={{ ...card, backgroundColor: "#fef2f2", borderColor: "#fca5a5", marginTop: "12px" }}>
                                <Text style={{ color: "#991b1b", fontSize: "13px", margin: 0 }}>
                                    <strong>Motif :</strong> {adminNote}
                                </Text>
                            </Section>
                        )}

                        <Section style={{ textAlign: "center", marginTop: "28px" }}>
                            <Button href={`${appUrl}/dashboard/payout`} style={ctaButton}>
                                Voir mes reversements →
                            </Button>
                        </Section>
                    </Section>

                    <Section style={footer}>
                        <Text style={footerText}>
                            Une question ?{" "}
                            <a href={`${appUrl}/contact`} style={footerLink}>Contactez le support</a>
                        </Text>
                        <Text style={footerCopyright}>
                            © {new Date().getFullYear()} Benin Events. Tous droits réservés.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
    backgroundColor: "#f3f4f6",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0, padding: 0,
};
const header: React.CSSProperties = { backgroundColor: "#000", padding: "20px 0" };
const logo: React.CSSProperties = { color: "#d4af37", fontSize: "28px", fontWeight: "900", margin: 0, letterSpacing: "2px", textAlign: "center" };
const logoSub: React.CSSProperties = { color: "#9ca3af", fontSize: "11px", margin: "2px 0 0", letterSpacing: "3px", textTransform: "uppercase", textAlign: "center" };
const container: React.CSSProperties = { backgroundColor: "#ffffff", maxWidth: "600px", margin: "0 auto" };
const heroSection: React.CSSProperties = { padding: "40px 40px 32px", textAlign: "center" };
const badge: React.CSSProperties = { display: "inline-block", fontSize: "13px", fontWeight: "700", padding: "6px 16px", borderRadius: "999px", margin: "0 0 20px" };
const h1: React.CSSProperties = { color: "#111827", fontSize: "24px", fontWeight: "800", margin: "0 0 12px", lineHeight: "1.3" };
const subtitle: React.CSSProperties = { color: "#6b7280", fontSize: "15px", margin: 0, lineHeight: "1.6" };
const divider: React.CSSProperties = { borderColor: "#f3f4f6", margin: 0 };
const section: React.CSSProperties = { padding: "32px 40px" };
const h2: React.CSSProperties = { color: "#111827", fontSize: "17px", fontWeight: "700", margin: "0 0 16px" };
const card: React.CSSProperties = { backgroundColor: "#f9fafb", borderRadius: "12px", padding: "16px 20px", border: "1px solid #e5e7eb" };
const cardRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: "14px", margin: "0 0 8px", color: "#374151" };
const cardLabel: React.CSSProperties = { color: "#6b7280" };
const cardValue: React.CSSProperties = { fontWeight: "700", color: "#111827" };
const ctaButton: React.CSSProperties = { backgroundColor: "#d4af37", color: "#000", fontSize: "14px", fontWeight: "700", padding: "14px 28px", borderRadius: "8px", textDecoration: "none", display: "inline-block" };
const footer: React.CSSProperties = { backgroundColor: "#f9fafb", padding: "24px 40px", textAlign: "center" };
const footerText: React.CSSProperties = { color: "#9ca3af", fontSize: "12px", margin: "0 0 4px" };
const footerLink: React.CSSProperties = { color: "#d4af37", textDecoration: "underline" };
const footerCopyright: React.CSSProperties = { color: "#d1d5db", fontSize: "11px", margin: "12px 0 0" };
