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
    ctaButtonSecondary,
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
                    : "Votre demande d'organisateur — retour de notre équipe"}
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
                        <Text style={badge(isApproved ? "success" : "danger")}>
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
                                ? `Bonjour ${applicantName}, bonne nouvelle : votre demande pour devenir organisateur sur Benin Events a été approuvée. Prêt à faire vivre vos évènements ?`
                                : `Bonjour ${applicantName}, merci d'avoir postulé ! Nous avons étudié votre demande avec attention, mais elle n'a pas pu être acceptée pour le moment.`}
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
                                            <Text style={{ ...conditionItem, marginBottom: 0, color: COLORS.mutedForeground, fontSize: "12px" }}>
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
                                    Ce n&apos;est que partie remise : vous
                                    pouvez soumettre une nouvelle demande dès
                                    que vous le souhaitez, avec des
                                    informations complémentaires. Une question
                                    sur cette décision ? Notre équipe est à
                                    votre écoute.
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
// Styles spécifiques à cet email
// ─────────────────────────────────────────────

const featureList: CSSProperties = {
    backgroundColor: COLORS.muted,
    borderRadius: "12px",
    padding: "20px 24px",
    border: `1px solid ${COLORS.border}`,
};

const featureItem: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "14px",
    margin: "0 0 10px",
    lineHeight: "1.5",
};

const conditionsBox: CSSProperties = {
    backgroundColor: COLORS.secondaryTint,
    borderRadius: "12px",
    padding: "20px 24px",
    border: `1px solid ${COLORS.secondary}`,
};

const conditionItem: CSSProperties = {
    color: "#7a5205",
    fontSize: "14px",
    margin: "0 0 10px",
    lineHeight: "1.5",
};
