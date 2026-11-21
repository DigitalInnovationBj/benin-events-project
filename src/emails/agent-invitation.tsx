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
import {
    badge,
    body,
    containerCard,
    ctaButtonPrimary,
    footerLink,
    h2,
    header,
    logo,
    logoSub,
    COLORS,
} from "./_theme";
import type { CSSProperties } from "react";

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

                <Container style={containerCard}>
                    <Section style={heroSection}>
                        <Text style={badge("brand")}>🎟️ Invitation Agent</Text>
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
                        <Heading as="h2" style={h2}>
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
                        <Heading as="h2" style={h2}>
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
                        <Button href={confirmUrl} style={ctaButtonPrimary}>
                            Confirmer ma participation
                        </Button>
                    </Section>

                    <Hr style={divider} />

                    <Text style={footerLine}>
                        Si vous n&apos;êtes pas concerné par cette invitation,
                        ignorez simplement cet email. Aucune action de votre
                        part n&apos;est requise.
                    </Text>
                    <Text style={footerLine}>
                        Benin Events · Pour toute question :{" "}
                        <a href="mailto:beninevents.officiel@gmail.com" style={footerLink}>
                            beninevents.officiel@gmail.com
                        </a>
                    </Text>
                </Container>
            </Body>
        </Html>
    );
}

// ─────────────────────────────────────────────
// Styles spécifiques à cet email
// ─────────────────────────────────────────────

const heroSection: CSSProperties = {
    textAlign: "center",
    marginBottom: "32px",
};

const heading: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "22px",
    fontWeight: "700",
    lineHeight: "1.3",
    margin: "0 0 12px",
};

const subtitle: CSSProperties = {
    color: COLORS.mutedForeground,
    fontSize: "15px",
    lineHeight: "1.6",
    margin: 0,
};

const divider: CSSProperties = {
    borderColor: COLORS.border,
    margin: "28px 0",
};

const detailsSection: CSSProperties = {
    marginBottom: "32px",
};

const detailsCard: CSSProperties = {
    backgroundColor: COLORS.muted,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "12px",
    padding: "20px 24px",
};

const detailLabelCol: CSSProperties = {
    width: "100px",
    verticalAlign: "top",
};

const detailLabel: CSSProperties = {
    color: COLORS.mutedForeground,
    fontSize: "13px",
    margin: 0,
};

const detailValue: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "14px",
    fontWeight: "500",
    margin: 0,
};

const roleItem: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "14px",
    margin: "0 0 8px",
    lineHeight: "1.5",
};

const ctaSection: CSSProperties = {
    textAlign: "center",
    marginBottom: "8px",
};

const ctaText: CSSProperties = {
    color: COLORS.mutedForeground,
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0 0 20px",
};

const footerLine: CSSProperties = {
    color: COLORS.mutedForeground,
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "0 0 8px",
};
