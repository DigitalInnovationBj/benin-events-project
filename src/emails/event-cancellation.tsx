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

export interface EventCancellationEmailProps {
    recipientName: string;
    eventTitle: string;
    eventDate: string;
    orderReference: string;
    totalAmount: number;
    reason?: string;
    appUrl: string;
}

export function EventCancellationEmail({
    recipientName,
    eventTitle,
    eventDate,
    orderReference,
    totalAmount,
    reason,
    appUrl,
}: EventCancellationEmailProps) {
    return (
        <Html lang="fr">
            <Head />
            <Preview>{`« ${eventTitle} » a été annulé — remboursement en cours`}</Preview>
            <Body style={body}>
                <Section style={header}>
                    <Container style={{ textAlign: "center" }}>
                        <Text style={logo}>BE</Text>
                        <Text style={logoSub}>Benin Events</Text>
                    </Container>
                </Section>

                <Container style={container}>
                    <Section style={heroSection}>
                        <Text style={badge("danger")}>✗ Évènement annulé</Text>
                        <Heading style={h1}>« {eventTitle} » est annulé</Heading>
                        <Text style={subtitle}>
                            Bonjour {recipientName}, on sait que ça peut être
                            décevant. L&apos;organisateur a dû annuler cet
                            évènement prévu le {eventDate} — mais pas
                            d&apos;inquiétude, on s&apos;occupe de tout.
                        </Text>
                    </Section>

                    <Hr style={divider} />

                    <Section style={section}>
                        {reason && (
                            <>
                                <Heading style={h2}>Motif</Heading>
                                <Text style={bodyText}>{reason}</Text>
                            </>
                        )}

                        <Heading style={{ ...h2, marginTop: "20px" }}>
                            Votre remboursement
                        </Heading>
                        <Section style={refundBox}>
                            <Text style={refundLine}>
                                <strong>Commande :</strong> {orderReference}
                            </Text>
                            <Text style={refundLine}>
                                <strong>Montant à rembourser :</strong>{" "}
                                {totalAmount.toLocaleString("fr-FR")} FCFA
                            </Text>
                        </Section>
                        <Text style={bodyText}>
                            Le remboursement sera crédité automatiquement sur
                            le moyen de paiement utilisé lors de
                            l&apos;achat, sans aucune action de votre part.
                            Vous recevrez une confirmation dès que ce sera
                            fait.
                        </Text>

                        <Section style={{ textAlign: "center", marginTop: "28px" }}>
                            <Button
                                href={`${appUrl}/contact`}
                                style={ctaButtonPrimary}
                            >
                                Une question ? On est là →
                            </Button>
                        </Section>
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

const refundBox: CSSProperties = {
    backgroundColor: COLORS.muted,
    borderRadius: "12px",
    padding: "18px 22px",
    border: `1px solid ${COLORS.border}`,
    marginBottom: "12px",
};

const refundLine: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "14px",
    margin: "0 0 6px",
};
