import {
    Body, Container, Head, Heading, Hr, Html,
    Img, Preview, Section, Text,
} from "@react-email/components";
import {
    badge,
    body,
    card,
    container,
    divider,
    footer,
    header,
    h1,
    h2,
    logo,
    logoSub,
    COLORS,
} from "./_theme";
import type { CSSProperties } from "react";

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
    onlineUrl?: string | null;
    postPurchaseMessage?: string | null;
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
    onlineUrl,
    postPurchaseMessage,
}: TicketGiftEmailProps) {
    const hasAccessInfo = Boolean(onlineUrl || postPurchaseMessage);
    return (
        <Html lang="fr">
            <Head />
            <Preview>{senderName} vous offre un billet pour {eventTitle}</Preview>
            <Body style={body}>
                {/* Header */}
                <Section style={header}>
                    <Container style={{ textAlign: "center" }}>
                        <Text style={logo}>BE</Text>
                        <Text style={logoSub}>Benin Events</Text>
                    </Container>
                </Section>

                <Container style={container}>
                    <Section style={{ padding: "40px 40px 24px" }}>
                        <Text style={badge("gold")}>🎁 Vous avez reçu un billet</Text>
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

                    {hasAccessInfo && (
                        <>
                            <Hr style={divider} />
                            <Section style={{ padding: "24px 40px" }}>
                                <Heading style={h2}>
                                    {eventType === "ONLINE"
                                        ? "Accès à l'évènement"
                                        : "Informations complémentaires"}
                                </Heading>
                                <Section style={card}>
                                    {onlineUrl && (
                                        <Text style={{ ...valueStyle, margin: "0 0 10px" }}>
                                            🔗{" "}
                                            <a href={onlineUrl} style={link}>
                                                {onlineUrl}
                                            </a>
                                        </Text>
                                    )}
                                    {postPurchaseMessage && (
                                        <div
                                            style={messageStyle}
                                            dangerouslySetInnerHTML={{
                                                __html: postPurchaseMessage,
                                            }}
                                        />
                                    )}
                                </Section>
                            </Section>
                        </>
                    )}

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

// ─────────────────────────────────────────────
// Styles spécifiques à cet email
// ─────────────────────────────────────────────

const intro: CSSProperties = { color: COLORS.foreground, fontSize: "15px", lineHeight: "1.6", margin: 0 };
const row: CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: "14px", margin: "0 0 8px", color: COLORS.foreground };
const labelStyle: CSSProperties = { color: COLORS.mutedForeground };
const valueStyle: CSSProperties = { fontWeight: "600", color: COLORS.foreground };
const qrHint: CSSProperties = { color: COLORS.mutedForeground, fontSize: "13px", margin: "0 0 20px" };
const qrImg: CSSProperties = { border: `4px solid ${COLORS.primary}`, borderRadius: "12px", padding: "8px", backgroundColor: COLORS.card };
const footerText: CSSProperties = { color: COLORS.mutedForeground, fontSize: "13px", margin: "0 0 8px" };
const footerCopy: CSSProperties = { color: "#a3a3a3", fontSize: "11px", margin: 0 };
const link: CSSProperties = { color: COLORS.primary, fontWeight: 600, textDecoration: "none" };
const messageStyle: CSSProperties = { color: COLORS.foreground, fontSize: "14px", lineHeight: "1.7" };
