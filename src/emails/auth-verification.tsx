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
                        <Heading style={h1}>
                            {isReset
                                ? "Réinitialisation de votre mot de passe"
                                : "Vérifiez votre adresse email"}
                        </Heading>
                        <Text style={subtitle}>
                            {isReset
                                ? "Utilisez le code ci-dessous pour réinitialiser votre mot de passe."
                                : "Utilisez le code ci-dessous pour confirmer votre adresse email et activer votre compte."}
                        </Text>
                    </Section>

                    <Hr style={divider} />

                    <Section style={section}>
                        <Section style={otpBox}>
                            <Text style={otpText}>{otp}</Text>
                        </Section>
                        <Text style={expiry}>
                            Ce code expire dans 5 minutes.
                        </Text>
                        <Text style={bodyText}>
                            Si vous n&apos;êtes pas à l&apos;origine de cette
                            demande, vous pouvez ignorer cet email en toute
                            sécurité — aucun changement ne sera effectué sur
                            votre compte.
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

const h1: React.CSSProperties = {
    color: "#111827",
    fontSize: "26px",
    fontWeight: "800",
    margin: "0 0 12px",
    lineHeight: "1.3",
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

const section: React.CSSProperties = {
    padding: "32px 40px",
    textAlign: "center",
};

const otpBox: React.CSSProperties = {
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    padding: "24px",
    border: "1px solid #e5e7eb",
};

const otpText: React.CSSProperties = {
    color: "#111827",
    fontSize: "36px",
    fontWeight: "800",
    letterSpacing: "12px",
    margin: 0,
    textAlign: "center",
};

const expiry: React.CSSProperties = {
    color: "#92400e",
    fontSize: "13px",
    fontWeight: "600",
    margin: "16px 0 20px",
};

const bodyText: React.CSSProperties = {
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.7",
    margin: 0,
};

const footer: React.CSSProperties = {
    backgroundColor: "#f9fafb",
    padding: "24px 40px",
    textAlign: "center",
};

const footerCopyright: React.CSSProperties = {
    color: "#d1d5db",
    fontSize: "11px",
    margin: 0,
};
