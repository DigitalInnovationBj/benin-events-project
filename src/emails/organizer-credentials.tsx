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
} from "@react-email/components";
import {
    badge,
    body,
    bodyText,
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
} from "./_theme";
import type { CSSProperties } from "react";

export interface OrganizerCredentialsEmailProps {
    organizerName: string;
    email: string;
    temporaryPassword: string;
    appUrl: string;
}

export function OrganizerCredentialsEmail({
    organizerName,
    email,
    temporaryPassword,
    appUrl,
}: OrganizerCredentialsEmailProps) {
    return (
        <Html lang="fr">
            <Head />
            <Preview>Votre compte organisateur Benin Events est prêt</Preview>
            <Body style={body}>
                <Section style={header}>
                    <Container style={{ textAlign: "center" }}>
                        <Text style={logo}>BE</Text>
                        <Text style={logoSub}>Benin Events</Text>
                    </Container>
                </Section>

                <Container style={container}>
                    <Section style={heroSection}>
                        <Text style={badge("success")}>✓ Compte créé</Text>
                        <Heading style={h1}>
                            Bienvenue parmi les organisateurs !
                        </Heading>
                        <Text style={subtitle}>
                            Bonjour {organizerName}, notre équipe a créé votre
                            compte organisateur sur Benin Events. Voici vos
                            identifiants de connexion.
                        </Text>
                    </Section>

                    <Hr style={divider} />

                    <Section style={section}>
                        <Heading style={h2}>Vos identifiants</Heading>
                        <Section style={credBox}>
                            <Text style={credLine}>
                                <strong>Email :</strong> {email}
                            </Text>
                            <Text style={{ ...credLine, marginBottom: 0 }}>
                                <strong>Mot de passe temporaire :</strong>{" "}
                                <span style={passwordStyle}>{temporaryPassword}</span>
                            </Text>
                        </Section>
                        <Text style={bodyText}>
                            Pour votre sécurité, changez ce mot de passe dès
                            votre première connexion via{" "}
                            <a href={`${appUrl}/forgot-password`} style={footerLink}>
                                Mot de passe oublié
                            </a>{" "}
                            — entrez simplement votre email pour recevoir un
                            code et choisir un nouveau mot de passe.
                        </Text>

                        <Section style={{ textAlign: "center", marginTop: "28px" }}>
                            <Button href={`${appUrl}/sign-in`} style={ctaButtonPrimary}>
                                Me connecter →
                            </Button>
                        </Section>
                    </Section>

                    <Section style={footer}>
                        <Text style={footerText}>
                            Une question ?{" "}
                            <a href={`${appUrl}/contact`} style={footerLink}>
                                Contactez-nous
                            </a>
                        </Text>
                        <Text style={footerCopyright}>
                            © {new Date().getFullYear()} Benin Events. Tous
                            droits réservés.
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

const credBox: CSSProperties = {
    backgroundColor: COLORS.muted,
    borderRadius: "12px",
    padding: "20px 24px",
    border: `1px solid ${COLORS.border}`,
};

const credLine: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "14px",
    margin: "0 0 10px",
};

const passwordStyle: CSSProperties = {
    fontFamily: "monospace",
    fontSize: "15px",
    fontWeight: 700,
    color: COLORS.primary,
};
