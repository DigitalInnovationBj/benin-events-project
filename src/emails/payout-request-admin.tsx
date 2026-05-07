import {
    Body, Container, Head, Heading, Hr, Html,
    Preview, Section, Text, Button,
} from "@react-email/components";

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
                    <Section style={{ padding: "40px 40px 24px" }}>
                        <Text style={badgeStyle}>💰 Nouvelle demande de reversement</Text>
                        <Heading style={h1}>Reversement à traiter</Heading>
                        <Text style={subtitle}>
                            L'organisateur <strong>{organizerName}</strong> ({organizerEmail}) a soumis une demande de reversement.
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
                            <Button href={adminPanelUrl} style={ctaButton}>
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

const body: React.CSSProperties = { backgroundColor: "#f3f4f6", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', margin: 0, padding: 0 };
const header: React.CSSProperties = { backgroundColor: "#000", padding: "20px 0" };
const logo: React.CSSProperties = { color: "#d4af37", fontSize: "28px", fontWeight: "900", margin: 0, letterSpacing: "2px", textAlign: "center" };
const logoSub: React.CSSProperties = { color: "#9ca3af", fontSize: "11px", margin: "2px 0 0", letterSpacing: "3px", textTransform: "uppercase", textAlign: "center" };
const container: React.CSSProperties = { backgroundColor: "#ffffff", maxWidth: "600px", margin: "0 auto" };
const badgeStyle: React.CSSProperties = { display: "inline-block", backgroundColor: "#fef9c3", color: "#854d0e", fontSize: "13px", fontWeight: "700", padding: "6px 16px", borderRadius: "999px", margin: "0 0 20px" };
const h1: React.CSSProperties = { color: "#111827", fontSize: "24px", fontWeight: "800", margin: "0 0 12px" };
const subtitle: React.CSSProperties = { color: "#6b7280", fontSize: "15px", margin: 0, lineHeight: "1.6" };
const divider: React.CSSProperties = { borderColor: "#f3f4f6", margin: 0 };
const h2: React.CSSProperties = { color: "#111827", fontSize: "17px", fontWeight: "700", margin: "0 0 12px" };
const card: React.CSSProperties = { backgroundColor: "#f9fafb", borderRadius: "12px", padding: "16px 20px", border: "1px solid #e5e7eb" };
const row: React.CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: "14px", margin: "0 0 8px", color: "#374151" };
const label: React.CSSProperties = { color: "#6b7280" };
const value: React.CSSProperties = { fontWeight: "700", color: "#111827" };
const ctaButton: React.CSSProperties = { backgroundColor: "#d4af37", color: "#000", fontSize: "14px", fontWeight: "700", padding: "14px 28px", borderRadius: "8px", textDecoration: "none", display: "inline-block" };
const footer: React.CSSProperties = { backgroundColor: "#f9fafb", padding: "20px 40px", textAlign: "center" };
const footerCopyright: React.CSSProperties = { color: "#d1d5db", fontSize: "11px", margin: 0 };
