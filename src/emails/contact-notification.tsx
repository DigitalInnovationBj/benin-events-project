import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Row,
    Column,
    Section,
    Text,
    Button,
} from "@react-email/components";
import {
    badge,
    body,
    containerCard,
    ctaButtonPrimary,
    footerLink,
    header,
    logo,
    logoSub,
    COLORS,
} from "./_theme";
import type { CSSProperties } from "react";

export interface ContactNotificationEmailProps {
    name: string;
    email: string;
    subject: string;
    message: string;
    adminPanelUrl: string;
}

export function ContactNotificationEmail({
    name,
    email,
    subject,
    message,
}: ContactNotificationEmailProps) {
    return (
        <Html lang="fr">
            <Head />
            <Preview>
                Nouveau message de {name} — {subject}
            </Preview>
            <Body style={body}>
                <Section style={header}>
                    <Container style={{ textAlign: "center" }}>
                        <Text style={logo}>BE</Text>
                        <Text style={logoSub}>Benin Events</Text>
                    </Container>
                </Section>

                <Container style={containerCard}>
                    <Text style={badge("brand")}>📬 Nouveau message de contact</Text>
                    <Heading style={heading}>
                        {subject}
                    </Heading>

                    <Section style={card}>
                        <Row style={{ marginBottom: "10px" }}>
                            <Column style={labelCol}>
                                <Text style={label}>Nom</Text>
                            </Column>
                            <Column>
                                <Text style={value}>{name}</Text>
                            </Column>
                        </Row>
                        <Row style={{ marginBottom: "10px" }}>
                            <Column style={labelCol}>
                                <Text style={label}>Email</Text>
                            </Column>
                            <Column>
                                <Text style={value}>{email}</Text>
                            </Column>
                        </Row>
                        <Row>
                            <Column style={labelCol}>
                                <Text style={label}>Sujet</Text>
                            </Column>
                            <Column>
                                <Text style={value}>{subject}</Text>
                            </Column>
                        </Row>
                    </Section>

                    <Hr style={divider} />

                    <Text style={messageLabel}>Message</Text>
                    <Section style={card}>
                        <Text style={messageText}>{message}</Text>
                    </Section>

                    <Section style={{ textAlign: "center", marginTop: "28px" }}>
                        <Button href={`mailto:${email}`} style={ctaButtonPrimary}>
                            Répondre à {name}
                        </Button>
                    </Section>

                    <Hr style={divider} />

                    <Text style={footer}>
                        Benin Events · Ce message a été envoyé depuis le
                        formulaire de contact de beninevents.com
                    </Text>
                </Container>
            </Body>
        </Html>
    );
}

// ─── Auto-reply ───────────────────────────────────────────────────────────────

export interface ContactAutoReplyEmailProps {
    name: string;
    subject: string;
    appUrl: string;
}

export function ContactAutoReplyEmail({
    name,
    subject,
    appUrl,
}: ContactAutoReplyEmailProps) {
    return (
        <Html lang="fr">
            <Head />
            <Preview>Nous avons bien reçu votre message — Benin Events</Preview>
            <Body style={body}>
                <Section style={header}>
                    <Container style={{ textAlign: "center" }}>
                        <Text style={logo}>BE</Text>
                        <Text style={logoSub}>Benin Events</Text>
                    </Container>
                </Section>

                <Container style={containerCard}>
                    <Text style={badge("success")}>✅ Message reçu</Text>
                    <Heading style={heading}>
                        Merci, {name} !
                    </Heading>
                    <Text style={subtitle}>
                        Nous avons bien reçu votre message concernant{" "}
                        <strong>« {subject} »</strong>.
                    </Text>
                    <Text style={subtitle}>
                        Notre équipe vous répondra dans les{" "}
                        <strong>24 heures ouvrées</strong> à cette adresse
                        e-mail.
                    </Text>

                    <Hr style={divider} />

                    <Text style={footer}>
                        Si votre demande est urgente, vous pouvez nous écrire
                        directement à{" "}
                        <a href="mailto:support@beninevents.com" style={footerLink}>
                            support@beninevents.com
                        </a>
                    </Text>
                    <Text style={footer}>
                        <a href={appUrl} style={footerLink}>
                            Retour au site
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

const heading: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "22px",
    fontWeight: "700",
    margin: "0 0 20px",
    lineHeight: "1.3",
};
const subtitle: CSSProperties = {
    color: COLORS.mutedForeground,
    fontSize: "15px",
    lineHeight: "1.6",
    margin: "0 0 12px",
};
const card: CSSProperties = {
    backgroundColor: COLORS.muted,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "12px",
    padding: "16px 20px",
    marginBottom: "20px",
};
const labelCol: CSSProperties = { width: "80px", verticalAlign: "top" };
const label: CSSProperties = {
    color: COLORS.mutedForeground,
    fontSize: "12px",
    margin: 0,
};
const value: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "13px",
    fontWeight: "500",
    margin: 0,
};
const divider: CSSProperties = {
    borderColor: COLORS.border,
    margin: "24px 0",
};
const messageLabel: CSSProperties = {
    color: COLORS.mutedForeground,
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    margin: "0 0 8px",
};
const messageText: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "14px",
    lineHeight: "1.7",
    margin: 0,
    whiteSpace: "pre-wrap",
};
const footer: CSSProperties = {
    color: COLORS.mutedForeground,
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "0 0 6px",
};
