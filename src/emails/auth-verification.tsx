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
} from "@react-email/components";
import {
    badge,
    body,
    bodyText,
    container,
    divider,
    footer,
    footerCopyright,
    h1,
    header,
    heroSection,
    logo,
    logoSub,
    section,
    subtitle,
    COLORS,
} from "./_theme";
import type { CSSProperties } from "react";

export interface AuthVerificationEmailProps {
    otp: string;
    /** "email-verification" (inscription) ou "forget-password" */
    type: "email-verification" | "forget-password" | "sign-in" | "change-email";
}

export function AuthVerificationEmail({ otp, type }: AuthVerificationEmailProps) {
    const isReset = type === "forget-password";

    return (
        <Html lang="fr">
            <Head />
            <Preview>
                {`${otp} — votre code ${isReset ? "de réinitialisation" : "de vérification"} Benin Events`}
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
                        <Text style={badge("brand")}>
                            {isReset ? "🔑 Réinitialisation" : "✉️ Vérification"}
                        </Text>
                        <Heading style={h1}>
                            {isReset
                                ? "On vous aide à revenir"
                                : "Plus qu'une étape !"}
                        </Heading>
                        <Text style={subtitle}>
                            {isReset
                                ? "Ça arrive à tout le monde. Entrez le code ci-dessous pour choisir un nouveau mot de passe."
                                : "Entrez le code ci-dessous pour confirmer votre adresse email et rejoindre la communauté des passionnés d'évènements au Bénin."}
                        </Text>
                    </Section>

                    <Hr style={divider} />

                    <Section style={{ ...section, textAlign: "center" }}>
                        <Section style={otpBox}>
                            <Text style={otpText}>{otp}</Text>
                        </Section>
                        <Text style={expiry}>
                            ⏱ Ce code expire dans 15 minutes.
                        </Text>
                        <Text style={bodyText}>
                            Vous n&apos;êtes pas à l&apos;origine de cette
                            demande ? Aucun souci, ignorez simplement cet
                            email : votre compte reste protégé.
                        </Text>
                    </Section>

                    <Section style={footer}>
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

const otpBox: CSSProperties = {
    backgroundColor: COLORS.muted,
    borderRadius: "12px",
    padding: "24px",
    border: `1px solid ${COLORS.border}`,
};

const otpText: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "36px",
    fontWeight: "800",
    letterSpacing: "12px",
    margin: 0,
    textAlign: "center",
};

const expiry: CSSProperties = {
    color: COLORS.warning,
    fontSize: "13px",
    fontWeight: "600",
    margin: "16px 0 20px",
};
