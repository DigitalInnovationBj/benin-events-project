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
    card,
    container,
    ctaButtonPrimary,
    divider,
    footer,
    footerCopyright,
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

export interface PartnerRequestAdminEmailProps {
    applicantName: string;
    applicantEmail: string;
    organizationName: string;
    sector: string;
    estimatedEventsPerYear: number;
    message?: string;
    adminPanelUrl: string;
}

export function PartnerRequestAdminEmail({
    applicantName,
    applicantEmail,
    organizationName,
    sector,
    estimatedEventsPerYear,
    message,
    adminPanelUrl,
}: PartnerRequestAdminEmailProps) {
    return (
        <Html lang="fr">
            <Head />
            <Preview>
                Nouvelle candidature partenaire — {organizationName}
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
                        <Text style={badge("brand")}>🤝 Candidature partenaire</Text>
                        <Heading style={h1}>Programme Partenaire</Heading>
                        <Text style={subtitle}>
                            Une structure souhaite rejoindre le programme
                            partenaire de Benin Events. Veuillez examiner sa
                            candidature.
                        </Text>
                    </Section>

                    <Hr style={divider} />

                    <Section style={section}>
                        <Heading style={h2}>Informations du candidat</Heading>
                        <Section style={card}>
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
                                    <Text style={infoLabel}>Structure</Text>
                                </Column>
                                <Column>
                                    <Text style={infoValue}>{organizationName}</Text>
                                </Column>
                            </Row>
                            <Hr style={innerDivider} />
                            <Row style={infoRow}>
                                <Column style={labelCol}>
                                    <Text style={infoLabel}>Secteur</Text>
                                </Column>
                                <Column>
                                    <Text style={infoValue}>{sector}</Text>
                                </Column>
                            </Row>
                            <Hr style={innerDivider} />
                            <Row style={infoRow}>
                                <Column style={labelCol}>
                                    <Text style={infoLabel}>
                                        Évènements / an (est.)
                                    </Text>
                                </Column>
                                <Column>
                                    <Text style={infoValue}>
                                        {estimatedEventsPerYear}
                                    </Text>
                                </Column>
                            </Row>
                            {message && (
                                <>
                                    <Hr style={innerDivider} />
                                    <Row>
                                        <Column>
                                            <Text style={infoLabel}>Message</Text>
                                            <Text style={descriptionText}>
                                                {message}
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
                            approuver ou refuser cette candidature.
                        </Text>
                        <Button href={adminPanelUrl} style={ctaButtonPrimary}>
                            Gérer les candidatures →
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
// Styles spécifiques à cet email
// ─────────────────────────────────────────────

const infoRow: CSSProperties = { verticalAlign: "top" };
const labelCol: CSSProperties = { width: "160px", verticalAlign: "top" };
const descriptionText: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "6px 0 0",
};
const ctaText: CSSProperties = {
    color: COLORS.mutedForeground,
    fontSize: "14px",
    margin: "0 0 20px",
};
