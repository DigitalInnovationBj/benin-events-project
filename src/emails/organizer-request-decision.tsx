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

export interface OrganizerRequestDecisionEmailProps {
    applicantName: string;
    status: "APPROVED" | "REJECTED";
    appUrl: string;
    eventCreationFeeEnabled?: boolean;
    eventCreationFee?: number;
    featuredEventFeeEnabled?: boolean;
    featuredEventFee?: number;
}

export function OrganizerRequestDecisionEmail({
    applicantName,
    status,
    appUrl,
    eventCreationFeeEnabled = false,
    eventCreationFee = 5000,
    featuredEventFeeEnabled = false,
    featuredEventFee = 5000,
}: OrganizerRequestDecisionEmailProps) {
    const isApproved = status === "APPROVED";

    return (
        <Html lang="fr">
            <Head />
            <Preview>
                {isApproved
                    ? "Félicitations ! Votre demande d'organisateur a été approuvée"
                    : "Votre demande d'organisateur — Décision"}
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
                        <Text
                            style={
                                isApproved ? successBadge : rejectedBadge
                            }
                        >
                            {isApproved
                                ? "✓ Demande approuvée"
                                : "✗ Demande refusée"}
                        </Text>
                        <Heading style={h1}>
                            {isApproved
                                ? "Bienvenue parmi les organisateurs !"
                                : "Votre demande n'a pas été retenue"}
                        </Heading>
                        <Text style={subtitle}>
                            {isApproved
                                ? `Bonjour ${applicantName}, votre demande pour devenir organisateur sur Benin Events a été examinée et approuvée.`
                                : `Bonjour ${applicantName}, nous avons bien examiné votre demande pour devenir organisateur. Malheureusement, elle n'a pas pu être acceptée à ce stade.`}
                        </Text>
                    </Section>

                    <Hr style={divider} />

                    <Section style={section}>
                        {isApproved ? (
                            <>
                                <Heading style={h2}>
                                    Vous pouvez maintenant…
                                </Heading>
                                <Section style={featureList}>
                                    <Text style={featureItem}>
                                        🎪{" "}
                                        <strong>
                                            Créer et gérer des évènements
                                        </strong>{" "}
                                        sur la plateforme
                                    </Text>
                                    <Text style={featureItem}>
                                        🎫{" "}
                                        <strong>
                                            Configurer vos billetteries
                                        </strong>{" "}
                                        avec des tarifs multiples
                                    </Text>
                                    <Text style={featureItem}>
                                        📊{" "}
                                        <strong>
                                            Suivre vos ventes
                                        </strong>{" "}
                                        depuis votre tableau de bord
                                    </Text>
                                    <Text style={featureItem}>
                                        🌍{" "}
                                        <strong>
                                            Toucher une audience
                                        </strong>{" "}
                                        à travers tout le Bénin
                                    </Text>
                                </Section>

                                {(eventCreationFeeEnabled || featuredEventFeeEnabled) && (
                                    <>
                                        <Heading style={{ ...h2, marginTop: "28px" }}>
                                            Conditions tarifaires
                                        </Heading>
                                        <Section style={conditionsBox}>
                                            {eventCreationFeeEnabled && (
                                                <Text style={conditionItem}>
                                                    💳{" "}
                                                    <strong>Publication d&apos;évènement :</strong>{" "}
                                                    {eventCreationFee.toLocaleString("fr-FR")} FCFA par évènement publié.
                                                </Text>
                                            )}
                                            {featuredEventFeeEnabled && (
                                                <Text style={conditionItem}>
                                                    ⭐{" "}
                                                    <strong>Mise en vedette :</strong>{" "}
                                                    {featuredEventFee.toLocaleString("fr-FR")} FCFA pour mettre un évènement en avant sur la page d&apos;accueil.
                                                </Text>
                                            )}
                                            <Text style={{ ...conditionItem, marginBottom: 0, color: "#6b7280", fontSize: "12px" }}>
                                                Ces tarifs sont susceptibles d&apos;évoluer. Consultez les paramètres de la plateforme pour les valeurs actuelles.
                                            </Text>
                                        </Section>
                                    </>
                                )}

                                <Section style={{ textAlign: "center", marginTop: "28px" }}>
                                    <Button
                                        href={`${appUrl}/dashboard/events/new`}
                                        style={ctaButtonPrimary}
                                    >
                                        Créer mon premier évènement →
                                    </Button>
                                </Section>
                            </>
                        ) : (
                            <>
                                <Heading style={h2}>Et maintenant ?</Heading>
                                <Text style={bodyText}>
                                    Vous pouvez soumettre une nouvelle demande
                                    ultérieurement avec des informations
                                    complémentaires. Si vous pensez qu&apos;il
                                    s&apos;agit d&apos;une erreur ou si vous
                                    souhaitez en savoir plus, n&apos;hésitez
                                    pas à nous contacter.
                                </Text>
                                <Section style={{ textAlign: "center", marginTop: "28px" }}>
                                    <Button
                                        href={`${appUrl}/contact`}
                                        style={ctaButtonSecondary}
                                    >
                                        Contacter le support
                                    </Button>
                                </Section>
                            </>
                        )}
                    </Section>

                    <Section style={footer}>
                        <Text style={footerText}>
                            Retrouvez votre tableau de bord sur{" "}
                            <a
                                href={`${appUrl}/dashboard`}
                                style={footerLink}
                            >
                                Benin Events
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

const successBadge: React.CSSProperties = {
    display: "inline-block",
    backgroundColor: "#d1fae5",
    color: "#065f46",
    fontSize: "13px",
    fontWeight: "700",
    padding: "6px 16px",
    borderRadius: "999px",
    margin: "0 0 20px",
};

const rejectedBadge: React.CSSProperties = {
    display: "inline-block",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
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
};

const h2: React.CSSProperties = {
    color: "#111827",
    fontSize: "18px",
    fontWeight: "700",
    margin: "0 0 16px",
};

const featureList: React.CSSProperties = {
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    padding: "20px 24px",
    border: "1px solid #e5e7eb",
};

const featureItem: React.CSSProperties = {
    color: "#374151",
    fontSize: "14px",
    margin: "0 0 10px",
    lineHeight: "1.5",
};

const bodyText: React.CSSProperties = {
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.7",
    margin: 0,
};

const ctaButtonPrimary: React.CSSProperties = {
    backgroundColor: "#d4af37",
    color: "#000",
    fontSize: "14px",
    fontWeight: "700",
    padding: "14px 28px",
    borderRadius: "8px",
    textDecoration: "none",
    display: "inline-block",
};

const ctaButtonSecondary: React.CSSProperties = {
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

const footerLink: React.CSSProperties = {
    color: "#d4af37",
    textDecoration: "underline",
};

const footerCopyright: React.CSSProperties = {
    color: "#d1d5db",
    fontSize: "11px",
    margin: "12px 0 0",
};

const conditionsBox: React.CSSProperties = {
    backgroundColor: "#fffbeb",
    borderRadius: "12px",
    padding: "20px 24px",
    border: "1px solid #fcd34d",
};

const conditionItem: React.CSSProperties = {
    color: "#92400e",
    fontSize: "14px",
    margin: "0 0 10px",
    lineHeight: "1.5",
};
