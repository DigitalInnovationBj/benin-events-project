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
    Row,
    Column,
} from "@react-email/components";

export interface OrganizerRequestAdminEmailProps {
    applicantName: string;
    applicantEmail: string;
    organizerName: string;
    organizerEmail: string;
    phoneNumber: string;
    address: string;
    description?: string;
    adminPanelUrl: string;
}

export function OrganizerRequestAdminEmail({
    applicantName,
    applicantEmail,
    organizerName,
    organizerEmail,
    phoneNumber,
    address,
    description,
    adminPanelUrl,
}: OrganizerRequestAdminEmailProps) {
    return (
        <Html lang="fr">
            <Head />
            <Preview>
                Nouvelle demande d&apos;organisateur — {organizerName}
            </Preview>
            <Body style={body}>
                <Section style={header}>
                    <Container style={{ textAlign: "center" }}>
                        <Text style={logo}>BE</Text>
                        <Text style={logoSub}>Benin Events</Text>
                    </Container>
                </Section>

                <Container style={container}>
                    <Section style={heroSection}>
                        <Text style={alertBadge}>🔔 Nouvelle demande</Text>
                        <Heading style={h1}>
                            Demande d&apos;organisateur
                        </Heading>
                        <Text style={subtitle}>
                            Un utilisateur souhaite devenir organisateur sur
                            Benin Events. Veuillez examiner sa demande.
                        </Text>
                    </Section>

                    <Hr style={divider} />

                    <Section style={section}>
                        <Heading style={h2}>Informations du demandeur</Heading>
                        <Section style={infoCard}>
                            <Row style={infoRow}>
                                <Column style={labelCol}>
                                    <Text style={infoLabel}>Compte</Text>
                                </Column>
                                <Column>
                                    <Text style={infoValue}>
                                        {applicantName} ({applicantEmail})
                                    </Text>
                                </Column>
                            </Row>
                            <Hr style={innerDivider} />
                            <Row style={infoRow}>
                                <Column style={labelCol}>
                                    <Text style={infoLabel}>
                                        Nom organisateur
                                    </Text>
                                </Column>
                                <Column>
                                    <Text style={infoValue}>
                                        {organizerName}
                                    </Text>
                                </Column>
                            </Row>
                            <Hr style={innerDivider} />
                            <Row style={infoRow}>
                                <Column style={labelCol}>
                                    <Text style={infoLabel}>Email pro</Text>
                                </Column>
                                <Column>
                                    <Text style={infoValue}>
                                        {organizerEmail}
                                    </Text>
                                </Column>
                            </Row>
                            <Hr style={innerDivider} />
                            <Row style={infoRow}>
                                <Column style={labelCol}>
                                    <Text style={infoLabel}>Téléphone</Text>
                                </Column>
                                <Column>
                                    <Text style={infoValue}>{phoneNumber}</Text>
                                </Column>
                            </Row>
                            <Hr style={innerDivider} />
                            <Row style={infoRow}>
                                <Column style={labelCol}>
                                    <Text style={infoLabel}>Adresse</Text>
                                </Column>
                                <Column>
                                    <Text style={infoValue}>{address}</Text>
                                </Column>
                            </Row>
                            {description && (
                                <>
                                    <Hr style={innerDivider} />
                                    <Row>
                                        <Column>
                                            <Text style={infoLabel}>
                                                Présentation
                                            </Text>
                                            <Text style={descriptionText}>
                                                {description}
                                            </Text>
                                        </Column>
                                    </Row>
                                </>
                            )}
                        </Section>
                    </Section>

                    <Hr style={divider} />

                    <Section style={{ ...section, textAlign: "center" }}>
                        <Text style={ctaText}>
                            Accédez au panneau d&apos;administration pour
                            approuver ou refuser cette demande.
                        </Text>
                        <Button href={adminPanelUrl} style={ctaButton}>
                            Gérer les demandes →
                        </Button>
                    </Section>

                    <Section style={footer}>
                        <Text style={footerText}>
                            Cet email est envoyé automatiquement par Benin
                            Events.
                        </Text>
                        <Text style={footerCopyright}>
                            © {new Date().getFullYear()} Benin Events
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

const alertBadge: React.CSSProperties = {
    display: "inline-block",
    backgroundColor: "#fef3c7",
    color: "#92400e",
    fontSize: "13px",
    fontWeight: "700",
    padding: "6px 16px",
    borderRadius: "999px",
    margin: "0 0 20px",
};

const h1: React.CSSProperties = {
    color: "#111827",
    fontSize: "26px",
    fontWeight: "800",
    margin: "0 0 12px",
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

const innerDivider: React.CSSProperties = {
    borderColor: "#e5e7eb",
    margin: "10px 0",
};

const section: React.CSSProperties = {
    padding: "32px 40px",
};

const h2: React.CSSProperties = {
    color: "#111827",
    fontSize: "16px",
    fontWeight: "700",
    margin: "0 0 16px",
};

const infoCard: React.CSSProperties = {
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid #e5e7eb",
};

const infoRow: React.CSSProperties = {
    verticalAlign: "top",
};

const labelCol: React.CSSProperties = {
    width: "140px",
    verticalAlign: "top",
};

const infoLabel: React.CSSProperties = {
    color: "#9ca3af",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    margin: 0,
};

const infoValue: React.CSSProperties = {
    color: "#111827",
    fontSize: "14px",
    fontWeight: "500",
    margin: 0,
};

const descriptionText: React.CSSProperties = {
    color: "#374151",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "6px 0 0",
};

const ctaText: React.CSSProperties = {
    color: "#6b7280",
    fontSize: "14px",
    margin: "0 0 20px",
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

const footerText: React.CSSProperties = {
    color: "#9ca3af",
    fontSize: "12px",
    margin: "0 0 4px",
};

const footerCopyright: React.CSSProperties = {
    color: "#d1d5db",
    fontSize: "11px",
    margin: "12px 0 0",
};
