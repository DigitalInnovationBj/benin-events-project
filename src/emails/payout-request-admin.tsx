import {
    Body, Container, Head, Heading, Hr, Html,
    Preview, Section, Text, Button,
} from "@react-email/components";
import {
    badge,
    body,
    card,
    container,
    ctaButtonPrimary,
    divider,
    footer,
    footerCopyright,
    h1,
    h2,
    header,
    heroSection,
    logo,
    logoSub,
    subtitle,
    COLORS,
} from "./_theme";
import type { CSSProperties } from "react";

export interface PayoutRequestAdminEmailProps {
    organizerName: string;
    organizerEmail: string;
    netAmount: number;
    grossAmount: number;
    commissionRate: number;
    methodType: "MOBILE_MONEY" | "BANK_TRANSFER";
    operator?: string;
    phoneNumber?: string;
    bankName?: string;
    accountName?: string;
    iban?: string;
    adminPanelUrl: string;
}

export function PayoutRequestAdminEmail({
    organizerName, organizerEmail, netAmount, grossAmount, commissionRate,
    methodType, operator, phoneNumber, bankName, accountName, iban, adminPanelUrl,
}: PayoutRequestAdminEmailProps) {
    return (
        <Html lang="fr">
            <Head />
            <Preview>Nouvelle demande de reversement — {organizerName}</Preview>
            <Body style={body}>
                <Section style={header}>
                    <Container style={{ textAlign: "center" }}>
                        <Text style={logo}>BE</Text>
                        <Text style={logoSub}>Benin Events — Admin</Text>
                    </Container>
                </Section>

                <Container style={container}>
                    <Section style={heroSection}>
                        <Text style={badge("warning")}>💰 Nouvelle demande de reversement</Text>
                        <Heading style={h1}>Reversement à traiter</Heading>
                        <Text style={subtitle}>
                            L&apos;organisateur <strong>{organizerName}</strong> ({organizerEmail}) a soumis une demande de reversement.
                        </Text>
                    </Section>

                    <Hr style={divider} />

                    <Section style={{ padding: "28px 40px" }}>
                        <Heading style={h2}>Montant</Heading>
                        <Section style={card}>
                            <Text style={row}><span style={label}>Net à reverser</span><span style={value}>{netAmount.toLocaleString("fr-FR")} FCFA</span></Text>
                            <Text style={row}><span style={label}>Brut (CA organisateur)</span><span style={value}>{grossAmount.toLocaleString("fr-FR")} FCFA</span></Text>
                            <Text style={row}><span style={label}>Commission plateforme</span><span style={value}>{commissionRate}%</span></Text>
                        </Section>

                        <Heading style={{ ...h2, marginTop: "24px" }}>Coordonnées de paiement</Heading>
                        <Section style={card}>
                            {methodType === "MOBILE_MONEY" ? (
                                <>
                                    <Text style={row}><span style={label}>Type</span><span style={value}>Mobile Money</span></Text>
                                    <Text style={row}><span style={label}>Opérateur</span><span style={value}>{operator}</span></Text>
                                    <Text style={row}><span style={label}>Numéro</span><span style={{ ...value, fontFamily: "monospace" }}>{phoneNumber}</span></Text>
                                </>
                            ) : (
                                <>
                                    <Text style={row}><span style={label}>Type</span><span style={value}>Virement bancaire</span></Text>
                                    <Text style={row}><span style={label}>Banque</span><span style={value}>{bankName}</span></Text>
                                    <Text style={row}><span style={label}>Titulaire</span><span style={value}>{accountName}</span></Text>
                                    <Text style={row}><span style={label}>RIB/IBAN</span><span style={{ ...value, fontFamily: "monospace", fontSize: "12px" }}>{iban}</span></Text>
                                </>
                            )}
                        </Section>

                        <Section style={{ textAlign: "center", marginTop: "28px" }}>
                            <Button href={adminPanelUrl} style={ctaButtonPrimary}>
                                Gérer les reversements →
                            </Button>
                        </Section>
                    </Section>

                    <Section style={footer}>
                        <Text style={footerCopyright}>© {new Date().getFullYear()} Benin Events</Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

// ─────────────────────────────────────────────
// Styles spécifiques à cet email
// ─────────────────────────────────────────────

const row: CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: "14px", margin: "0 0 8px", color: COLORS.foreground };
const label: CSSProperties = { color: COLORS.mutedForeground };
const value: CSSProperties = { fontWeight: "700", color: COLORS.foreground };
