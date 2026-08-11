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

export interface RefundConfirmationEmailProps {
    recipientName: string;
    eventTitle: string;
    orderReference: string;
    totalAmount: number;
}

export function RefundConfirmationEmail({
    recipientName,
    eventTitle,
    orderReference,
    totalAmount,
}: RefundConfirmationEmailProps) {
    return (
        <Html lang="fr">
            <Head />
            <Preview>Votre remboursement de {totalAmount.toLocaleString("fr-FR")} FCFA a été effectué</Preview>
            <Body style={body}>
                <Section style={header}>
                    <Container style={{ textAlign: "center" }}>
                        <Text style={logo}>BE</Text>
                        <Text style={logoSub}>Benin Events</Text>
                    </Container>
                </Section>

                <Container style={container}>
                    <Section style={heroSection}>
                        <Text style={badge("success")}>✓ Remboursement effectué</Text>
                        <Heading style={h1}>C&apos;est fait, {recipientName} !</Heading>
                        <Text style={subtitle}>
                            Le remboursement de votre billet pour «{" "}
                            {eventTitle} » a bien été traité. L&apos;argent
                            est en route vers vous 💸
                        </Text>
                    </Section>

                    <Hr style={divider} />

                    <Section style={section}>
                        <Text style={line}>
                            <strong>Commande :</strong> {orderReference}
                        </Text>
                        <Text style={line}>
                            <strong>Montant remboursé :</strong>{" "}
                            {totalAmount.toLocaleString("fr-FR")} FCFA
                        </Text>
                        <Text style={{ ...bodyText, margin: "12px 0 0" }}>
                            Selon votre moyen de paiement, comptez de quelques
                            minutes à quelques jours ouvrés avant de le voir
                            apparaître. Merci pour votre patience !
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

const line: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "14px",
    margin: "0 0 8px",
};
