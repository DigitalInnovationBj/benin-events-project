import {
    Body, Container, Head, Heading, Hr, Html,
    Img, Preview, Section, Text,
} from "@react-email/components";

export interface TicketGiftEmailProps {
    recipientName: string;
    senderName: string;
    eventTitle: string;
    eventDate: string;
    eventLocation: string | null;
    eventType: "IN_PERSON" | "ONLINE";
    ticketTitle: string;
    qrCodeUrl: string;
    orderItemId: string;
    orderReference: string;
    appUrl: string;
}

export function TicketGiftEmail({
    recipientName,
    senderName,
    eventTitle,
    eventDate,
    eventLocation,
    eventType,
    ticketTitle,
    qrCodeUrl,
    appUrl,
}: TicketGiftEmailProps) {
    return (
        <Html lang="fr">
            <Head />
            <Preview>{senderName} vous offre un billet pour {eventTitle}</Preview>
            <Body style={body}>
                {/* Header */}
                <Section style={header}>
                    <Container style={{ textAlign: "center" }}>
                        <Text style={logo}>Benin Events</Text>
                    </Container>
                </Section>

                <Container style={container}>
                    <Section style={{ padding: "40px 40px 24px" }}>
                        <Text style={badge}>🎁 Vous avez reçu un billet</Text>
                        <Heading style={h1}>Bonjour {recipientName} !</Heading>
                        <Text style={intro}>
                            <strong>{senderName}</strong> vous offre un billet pour assister à{" "}
                            <strong>{eventTitle}</strong>. Votre QR code d&apos;entrée est ci-dessous.
                        </Text>
                    </Section>

                    <Hr style={divider} />

                    {/* Infos évènement */}
                    <Section style={{ padding: "24px 40px" }}>
                        <Heading style={h2}>Détails de l&apos;évènement</Heading>
                        <Section style={card}>
                            <Text style={row}><span style={labelStyle}>Évènement</span><span style={valueStyle}>{eventTitle}</span></Text>
                            <Text style={row}><span style={labelStyle}>Date</span><span style={valueStyle}>{eventDate}</span></Text>
                            <Text style={row}>
                                <span style={labelStyle}>{eventType === "IN_PERSON" ? "Lieu" : "Format"}</span>
                                <span style={valueStyle}>{eventType === "IN_PERSON" ? (eventLocation ?? "À confirmer") : "En ligne"}</span>
                            </Text>
                            <Text style={row}><span style={labelStyle}>Billet</span><span style={valueStyle}>{ticketTitle}</span></Text>
                        </Section>
                    </Section>

                    <Hr style={divider} />

                    {/* QR Code */}
                    <Section style={{ padding: "24px 40px", textAlign: "center" }}>
                        <Heading style={h2}>Votre QR code d&apos;entrée</Heading>
                        <Text style={qrHint}>
                            Présentez ce QR code à l&apos;entrée de l&apos;évènement. Faites-en une capture d&apos;écran pour y accéder hors connexion.
                        </Text>
                        <Img
                            src={qrCodeUrl}
                            width={220}
                            height={220}
                            alt="QR code d'entrée"
                            style={qrImg}
                        />
                    </Section>

                    <Hr style={divider} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            Ce billet vous a été offert via{" "}
                            <a href={appUrl} style={link}>Benin Events</a>.
                            En cas de problème, contactez{" "}
                            <a href={`${appUrl}/contact`} style={link}>notre support</a>.
                        </Text>
                        <Text style={footerCopy}>© {new Date().getFullYear()} Benin Events</Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

const body: React.CSSProperties = { backgroundColor: "#f3f4f6", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', margin: 0, padding: 0 };
const header: React.CSSProperties = { backgroundColor: "#000", padding: "20px 0" };
const logo: React.CSSProperties = { color: "#d4af37", fontSize: "28px", fontWeight: "900", margin: 0, letterSpacing: "2px", textAlign: "center" };
const container: React.CSSProperties = { backgroundColor: "#ffffff", maxWidth: "600px", margin: "0 auto" };
const badge: React.CSSProperties = { display: "inline-block", backgroundColor: "#fef9c3", color: "#854d0e", fontSize: "13px", fontWeight: "700", padding: "6px 16px", borderRadius: "999px", margin: "0 0 20px" };
const h1: React.CSSProperties = { color: "#111827", fontSize: "24px", fontWeight: "800", margin: "0 0 12px" };
const intro: React.CSSProperties = { color: "#374151", fontSize: "15px", lineHeight: "1.6", margin: 0 };
const divider: React.CSSProperties = { borderColor: "#f3f4f6", margin: 0 };
const h2: React.CSSProperties = { color: "#111827", fontSize: "17px", fontWeight: "700", margin: "0 0 12px" };
const card: React.CSSProperties = { backgroundColor: "#f9fafb", borderRadius: "12px", padding: "16px 20px", border: "1px solid #e5e7eb" };
const row: React.CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: "14px", margin: "0 0 8px", color: "#374151" };
const labelStyle: React.CSSProperties = { color: "#6b7280" };
const valueStyle: React.CSSProperties = { fontWeight: "600", color: "#111827" };
const qrHint: React.CSSProperties = { color: "#6b7280", fontSize: "13px", margin: "0 0 20px" };
const qrImg: React.CSSProperties = { border: "1px solid #e5e7eb", borderRadius: "12px", padding: "8px", backgroundColor: "#fff" };
const footer: React.CSSProperties = { padding: "24px 40px", textAlign: "center", backgroundColor: "#f9fafb" };
const footerText: React.CSSProperties = { color: "#6b7280", fontSize: "13px", margin: "0 0 8px" };
const footerCopy: React.CSSProperties = { color: "#d1d5db", fontSize: "11px", margin: 0 };
const link: React.CSSProperties = { color: "#d4af37", textDecoration: "none" };
