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
                        <Text style={badge}>✓ Remboursement effectué</Text>
                        <Heading style={h1}>C&apos;est fait, {recipientName} !</Heading>
                        <Text style={subtitle}>
                            Le remboursement de votre billet pour «{" "}
                            {eventTitle} » a été traité.
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
                        <Text style={bodyText}>
                            Selon votre moyen de paiement, le délai de
                            réception peut varier de quelques minutes à
                            quelques jours ouvrés.
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

const badge: React.CSSProperties = {
    display: "inline-block",
    backgroundColor: "#d1fae5",
    color: "#065f46",
    fontSize: "13px",
    fontWeight: "700",
    padding: "6px 16px",
    borderRadius: "999px",
    margin: "0 0 20px",
};

const h1: React.CSSProperties = {
    color: "#111827",
    fontSize: "24px",
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

const line: React.CSSProperties = {
    color: "#374151",
    fontSize: "14px",
    margin: "0 0 8px",
};

const bodyText: React.CSSProperties = {
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.7",
    margin: "12px 0 0",
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
