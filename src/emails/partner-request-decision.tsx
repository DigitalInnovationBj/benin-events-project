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

export interface PartnerRequestDecisionEmailProps {
    applicantName: string;
    status: "APPROVED" | "REJECTED";
    appUrl: string;
    commissionRate?: number;
    standardCommissionRate?: number;
    eventCreationFeeEnabled?: boolean;
    eventCreationFee?: number;
    featuredEventFeeEnabled?: boolean;
    featuredEventFee?: number;
}

export function PartnerRequestDecisionEmail({
    applicantName,
    status,
    appUrl,
    commissionRate,
    standardCommissionRate,
    eventCreationFeeEnabled,
    eventCreationFee,
    featuredEventFeeEnabled,
    featuredEventFee,
}: PartnerRequestDecisionEmailProps) {
    const rate = commissionRate ?? 0;
    const hasDiscount =
        standardCommissionRate !== undefined && standardCommissionRate > rate;
    const isApproved = status === "APPROVED";

    return (
        <Html lang="fr">
            <Head />
            <Preview>
                {isApproved
                    ? "Bienvenue dans le programme Partenaire Benin Events !"
                    : "Votre candidature partenaire — retour de notre équipe"}
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
                                ? "✓ Candidature approuvée"
                                : "✗ Candidature refusée"}
                        </Text>
                        <Heading style={h1}>
                            {isApproved
                                ? "Bienvenue parmi nos partenaires !"
                                : "Votre candidature n'a pas été retenue"}
                        </Heading>
                        <Text style={subtitle}>
                            {isApproved
                                ? `Bonjour ${applicantName}, bonne nouvelle : votre candidature au programme Partenaire Benin Events a été approuvée.`
                                : `Bonjour ${applicantName}, merci pour votre candidature. Nous l'avons étudiée avec attention, mais elle n'a pas pu être acceptée pour le moment.`}
                        </Text>
                    </Section>

                    <Hr style={divider} />

                    <Section style={section}>
                        {isApproved ? (
                            <>
                                <Heading style={h2}>Vos avantages partenaire</Heading>
                                <Section style={perkBox}>
                                    <Text style={perkText}>
                                        💰{" "}
                                        <strong>
                                            Commission plateforme : {rate}%
                                        </strong>{" "}
                                        sur vos ventes de billets
                                        {hasDiscount
                                            ? ` (au lieu de ${standardCommissionRate}% en temps normal)`
                                            : ""}
                                        , appliquée automatiquement à vos
                                        prochains reversements.
                                    </Text>
                                </Section>

                                <Heading style={{ ...h2, marginTop: "24px" }}>
                                    Frais inchangés
                                </Heading>
                                <Section style={conditionsBox}>
                                    <Text style={conditionItem}>
                                        Votre statut partenaire porte
                                        uniquement sur la commission
                                        ci-dessus. Les autres conditions
                                        restent identiques à celles de tous
                                        les organisateurs :
                                    </Text>
                                    <Text style={conditionItem}>
                                        💳{" "}
                                        <strong>Publication d&apos;évènement :</strong>{" "}
                                        {eventCreationFeeEnabled
                                            ? `${(eventCreationFee ?? 0).toLocaleString("fr-FR")} FCFA par évènement publié.`
                                            : "gratuite actuellement."}
                                    </Text>
                                    <Text style={{ ...conditionItem, marginBottom: 0 }}>
                                        ⭐{" "}
                                        <strong>Mise en vedette :</strong>{" "}
                                        {featuredEventFeeEnabled
                                            ? `${(featuredEventFee ?? 0).toLocaleString("fr-FR")} FCFA pour mettre un évènement en avant.`
                                            : "gratuite actuellement."}
                                    </Text>
                                </Section>

                                <Section style={{ textAlign: "center", marginTop: "28px" }}>
                                    <Button
                                        href={`${appUrl}/dashboard/events/new`}
                                        style={ctaButtonPrimary}
                                    >
                                        Créer mon prochain évènement →
                                    </Button>
                                </Section>
                            </>
                        ) : (
                            <>
                                <Heading style={h2}>Et maintenant ?</Heading>
                                <Text style={bodyText}>
                                    Vous pouvez soumettre une nouvelle
                                    candidature ultérieurement. Une question
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
                            <a href={`${appUrl}/dashboard`} style={footerLink}>
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

const perkBox: CSSProperties = {
    backgroundColor: COLORS.secondaryTint,
    borderRadius: "12px",
    padding: "20px 24px",
    border: `1px solid ${COLORS.secondary}`,
};

const perkText: CSSProperties = {
    color: "#7a5205",
    fontSize: "14px",
    margin: 0,
    lineHeight: "1.5",
};

const conditionsBox: CSSProperties = {
    backgroundColor: COLORS.muted,
    borderRadius: "12px",
    padding: "20px 24px",
    border: `1px solid ${COLORS.border}`,
};

const conditionItem: CSSProperties = {
    color: COLORS.mutedForeground,
    fontSize: "14px",
    margin: "0 0 10px",
    lineHeight: "1.5",
};
