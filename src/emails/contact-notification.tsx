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
    adminPanelUrl,
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

                <Container style={container}>
                    <Text style={badge}>📬 Nouveau message de contact</Text>
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
                    <Section style={messageBox}>
                        <Text style={messageText}>{message}</Text>
                    </Section>

                    <Section style={{ textAlign: "center", marginTop: "28px" }}>
                        <Button href={`mailto:${email}`} style={ctaButton}>
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

                <Container style={container}>
                    <Text style={badge}>✅ Message reçu</Text>
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
                        <a href="mailto:support@beninevents.com" style={link}>
                            support@beninevents.com
                        </a>
                    </Text>
                    <Text style={footer}>
                        <a href={appUrl} style={link}>
                            Retour au site
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
    fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
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
    padding: "36px 44px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};
const badge: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: "600",
    color: "#52525b",
    margin: "0 0 12px 0",
};
const heading: React.CSSProperties = {
    color: "#09090b",
    fontSize: "22px",
    fontWeight: "700",
    margin: "0 0 20px 0",
    lineHeight: "1.3",
};
const subtitle: React.CSSProperties = {
    color: "#52525b",
    fontSize: "15px",
    lineHeight: "1.6",
    margin: "0 0 12px 0",
};
const card: React.CSSProperties = {
    backgroundColor: "#fafafa",
    border: "1px solid #e4e4e7",
    borderRadius: "12px",
    padding: "16px 20px",
    marginBottom: "20px",
};
const labelCol: React.CSSProperties = { width: "80px", verticalAlign: "top" };
const label: React.CSSProperties = {
    color: "#71717a",
    fontSize: "12px",
    margin: 0,
};
const value: React.CSSProperties = {
    color: "#09090b",
    fontSize: "13px",
    fontWeight: "500",
    margin: 0,
};
const divider: React.CSSProperties = {
    borderColor: "#e4e4e7",
    margin: "24px 0",
};
const messageLabel: React.CSSProperties = {
    color: "#71717a",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    margin: "0 0 8px 0",
};
const messageBox: React.CSSProperties = {
    backgroundColor: "#fafafa",
    border: "1px solid #e4e4e7",
    borderRadius: "12px",
    padding: "16px 20px",
};
const messageText: React.CSSProperties = {
    color: "#3f3f46",
    fontSize: "14px",
    lineHeight: "1.7",
    margin: 0,
    whiteSpace: "pre-wrap",
};
const ctaButton: React.CSSProperties = {
    backgroundColor: "#d4af37",
    borderRadius: "10px",
    color: "#09090b",
    display: "inline-block",
    fontSize: "14px",
    fontWeight: "700",
    padding: "12px 28px",
    textDecoration: "none",
};
const footer: React.CSSProperties = {
    color: "#a1a1aa",
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "0 0 6px 0",
};
const link: React.CSSProperties = { color: "#d4af37", textDecoration: "none" };
