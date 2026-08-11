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
                        <Text style={badge("brand")}>🔔 Nouvelle demande</Text>
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
                        <Button href={adminPanelUrl} style={ctaButtonPrimary}>
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
// Styles spécifiques à cet email
// ─────────────────────────────────────────────

const infoRow: CSSProperties = {
    verticalAlign: "top",
};

const labelCol: CSSProperties = {
    width: "140px",
    verticalAlign: "top",
};

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
