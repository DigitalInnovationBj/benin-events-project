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

export interface AgentInvitationEmailProps {
    recipientName: string;
    eventTitle: string;
    eventDate: string;
    eventLocation: string | null;
    eventType: "IN_PERSON" | "ONLINE";
    organizerName: string;
    confirmUrl: string;
}

export function AgentInvitationEmail({
    recipientName,
    eventTitle,
    eventDate,
    eventLocation,
    eventType,
    organizerName,
    confirmUrl,
}: AgentInvitationEmailProps) {
    return (
        <Html lang="fr">
            <Head />
            <Preview>
                Invitation à devenir agent pour « {eventTitle} »
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
                        <Text style={badge}>🎟️ Invitation Agent</Text>
                        <Heading style={heading}>
                            Vous êtes invité à rejoindre l&apos;équipe
                        </Heading>
                        <Text style={subtitle}>
                            Bonjour {recipientName}, {organizerName} vous
                            invite à devenir agent pour l&apos;évènement
                            ci-dessous.
                        </Text>
                    </Section>

                    <Hr style={divider} />

                    {/* Event details */}
                    <Section style={detailsSection}>
                        <Heading as="h2" style={sectionTitle}>
                            Détails de l&apos;évènement
                        </Heading>

                        <Section style={detailsCard}>
                            <Row style={{ marginBottom: "12px" }}>
                                <Column style={detailLabelCol}>
                                    <Text style={detailLabel}>Évènement</Text>
                                </Column>
                                <Column>
                                    <Text style={detailValue}>{eventTitle}</Text>
                                </Column>
                            </Row>
                            <Row style={{ marginBottom: "12px" }}>
                                <Column style={detailLabelCol}>
                                    <Text style={detailLabel}>Date</Text>
                                </Column>
                                <Column>
                                    <Text style={detailValue}>{eventDate}</Text>
                                </Column>
                            </Row>
                            <Row style={{ marginBottom: "12px" }}>
                                <Column style={detailLabelCol}>
                                    <Text style={detailLabel}>Type</Text>
                                </Column>
                                <Column>
                                    <Text style={detailValue}>
                                        {eventType === "IN_PERSON"
                                            ? "Présentiel"
                                            : "En ligne"}
                                    </Text>
                                </Column>
                            </Row>
                            {eventType === "IN_PERSON" && eventLocation && (
                                <Row>
                                    <Column style={detailLabelCol}>
                                        <Text style={detailLabel}>Lieu</Text>
                                    </Column>
                                    <Column>
                                        <Text style={detailValue}>
                                            {eventLocation}
                                        </Text>
                                    </Column>
                                </Row>
                            )}
                        </Section>
                    </Section>

                    <Hr style={divider} />

                    {/* Role description */}
                    <Section style={{ marginBottom: "32px" }}>
                        <Heading as="h2" style={sectionTitle}>
                            Votre rôle en tant qu&apos;agent
                        </Heading>
                        <Text style={roleItem}>
                            ✅ Scanner les QR codes des billets à l&apos;entrée
                        </Text>
                        <Text style={roleItem}>
                            ✅ Vérifier la validité des tickets en temps réel
                        </Text>
                        <Text style={roleItem}>
                            ✅ Accéder à l&apos;interface de scan depuis votre
                            téléphone
                        </Text>
                    </Section>

                    {/* CTA */}
                    <Section style={ctaSection}>
                        <Text style={ctaText}>
                            Cliquez sur le bouton ci-dessous pour confirmer
                            votre participation. Ce lien est valable 48 heures.
                        </Text>
                        <Button href={confirmUrl} style={ctaButton}>
                            Confirmer ma participation
                        </Button>
                    </Section>

                    <Hr style={divider} />

                    <Text style={footer}>
                        Si vous n&apos;êtes pas concerné par cette invitation,
                        ignorez simplement cet email. Aucune action de votre
                        part n&apos;est requise.
                    </Text>
                    <Text style={footerLinks}>
                        Benin Events · Pour toute question :{" "}
                        <a href="mailto:contact@beninevents.com" style={link}>
                            contact@beninevents.com
                        </a>
                    </Text>
                </Container>
            </Body>
        </Html>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
    backgroundColor: "#f4f4f5",
    fontFamily:
        "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
    margin: 0,
    padding: 0,
};

const header: React.CSSProperties = {
    backgroundColor: "#09090b",
    padding: "24px 0",
    textAlign: "center",
};

const logo: React.CSSProperties = {
    color: "#d4af37",
    fontSize: "28px",
    fontWeight: "900",
    letterSpacing: "4px",
    margin: "0 0 2px 0",
};

const logoSub: React.CSSProperties = {
    color: "#a1a1aa",
    fontSize: "11px",
    letterSpacing: "3px",
    textTransform: "uppercase",
    margin: 0,
};

const container: React.CSSProperties = {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    margin: "24px auto",
    maxWidth: "560px",
    padding: "40px 48px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

const heroSection: React.CSSProperties = {
    textAlign: "center",
    marginBottom: "32px",
};

const badge: React.CSSProperties = {
    display: "inline-block",
    backgroundColor: "#fef3c7",
    color: "#92400e",
    fontSize: "13px",
    fontWeight: "600",
    padding: "6px 16px",
    borderRadius: "100px",
    margin: "0 0 16px 0",
};

const heading: React.CSSProperties = {
    color: "#09090b",
    fontSize: "22px",
    fontWeight: "700",
    lineHeight: "1.3",
    margin: "0 0 12px 0",
};

const subtitle: React.CSSProperties = {
    color: "#52525b",
    fontSize: "15px",
    lineHeight: "1.6",
    margin: 0,
};

const divider: React.CSSProperties = {
    borderColor: "#e4e4e7",
    margin: "28px 0",
};

const detailsSection: React.CSSProperties = {
    marginBottom: "32px",
};

const sectionTitle: React.CSSProperties = {
    color: "#09090b",
    fontSize: "15px",
    fontWeight: "700",
    margin: "0 0 16px 0",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
};

const detailsCard: React.CSSProperties = {
    backgroundColor: "#fafafa",
    border: "1px solid #e4e4e7",
    borderRadius: "12px",
    padding: "20px 24px",
};

const detailLabelCol: React.CSSProperties = {
    width: "100px",
    verticalAlign: "top",
};

const detailLabel: React.CSSProperties = {
    color: "#71717a",
    fontSize: "13px",
    margin: 0,
};

const detailValue: React.CSSProperties = {
    color: "#09090b",
    fontSize: "14px",
    fontWeight: "500",
    margin: 0,
};

const roleItem: React.CSSProperties = {
    color: "#3f3f46",
    fontSize: "14px",
    margin: "0 0 8px 0",
    lineHeight: "1.5",
};

const ctaSection: React.CSSProperties = {
    textAlign: "center",
    marginBottom: "8px",
};

const ctaText: React.CSSProperties = {
    color: "#52525b",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0 0 20px 0",
};

const ctaButton: React.CSSProperties = {
    backgroundColor: "#d4af37",
    borderRadius: "10px",
    color: "#09090b",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: "700",
    padding: "14px 36px",
    textDecoration: "none",
};

const footer: React.CSSProperties = {
    color: "#a1a1aa",
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "0 0 8px 0",
};

const footerLinks: React.CSSProperties = {
    color: "#a1a1aa",
    fontSize: "12px",
    margin: 0,
};

const link: React.CSSProperties = {
    color: "#d4af37",
    textDecoration: "none",
};
