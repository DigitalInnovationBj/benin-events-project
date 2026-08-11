import {
    Body, Container, Head, Heading, Hr, Html,
    Preview, Section, Text, Button,
} from "@react-email/components";
import {
    badge,
    body,
    container,
    ctaButtonPrimary,
    divider,
    footer,
    footerCopyright,
    footerLink,
    footerText,
    h1,
    h2,
    header,
    heroSection,
    logo,
    logoSub,
    section,
    subtitle,
    COLORS,
    type BadgeTone,
} from "./_theme";
import type { CSSProperties } from "react";

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

const CONFIG: Record<PayoutNotifType, { badgeLabel: string; tone: BadgeTone; title: string; body: string }> = {
    REQUESTED: {
        badgeLabel: "⏳ Demande reçue",
        tone: "warning",
        title: "Demande de reversement reçue !",
        body: "C'est noté ! Elle vient d'entrer dans la file de traitement — on s'en occupe rapidement.",
    },
    PROCESSING: {
        badgeLabel: "🔄 En cours",
        tone: "info",
        title: "Ça bouge, votre reversement arrive !",
        body: "Le virement est en route vers votre compte. Vous recevrez un email de confirmation dès qu'il sera arrivé à destination.",
    },
    PAID: {
        badgeLabel: "✅ Reversement effectué",
        tone: "success",
        title: "Reversement envoyé, bravo pour cet évènement 🎉",
        body: "Le montant a été envoyé selon vos coordonnées de paiement enregistrées. Merci de faire vivre les évènements au Bénin avec nous !",
    },
    REJECTED: {
        badgeLabel: "✗ Demande rejetée",
        tone: "danger",
        title: "Petit souci avec votre demande",
        body: "Elle n'a pas pu être traitée cette fois. Regardez le motif ci-dessous, et n'hésitez pas à nous contacter pour la corriger.",
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
                        <Text style={badge(cfg.tone)}>{cfg.badgeLabel}</Text>
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
                                    <span style={{ ...cardValue, color: COLORS.success }}>Offerte (0%)</span>
                                </Text>
                            )}
                        </Section>

                        {adminNote && type === "REJECTED" && (
                            <Section style={{ ...card, backgroundColor: COLORS.dangerBg, borderColor: COLORS.danger, marginTop: "12px" }}>
                                <Text style={{ color: COLORS.danger, fontSize: "13px", margin: 0 }}>
                                    <strong>Motif :</strong> {adminNote}
                                </Text>
                            </Section>
                        )}

                        <Section style={{ textAlign: "center", marginTop: "28px" }}>
                            <Button href={`${appUrl}/dashboard/payout`} style={ctaButtonPrimary}>
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

// ─────────────────────────────────────────────
// Styles spécifiques à cet email
// ─────────────────────────────────────────────

const card: CSSProperties = {
    backgroundColor: COLORS.muted,
    borderRadius: "12px",
    padding: "16px 20px",
    border: `1px solid ${COLORS.border}`,
};
const cardRow: CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: "14px", margin: "0 0 8px", color: COLORS.foreground };
const cardLabel: CSSProperties = { color: COLORS.mutedForeground };
const cardValue: CSSProperties = { fontWeight: "700", color: COLORS.foreground };
