import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
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
    footerLink,
    footerText,
    h1,
    header,
    heroSection,
    logo,
    logoSub,
    section,
    COLORS,
} from "./_theme";
import type { CSSProperties } from "react";

export interface EventCampaignEmailProps {
    recipientName: string;
    organizerName: string;
    subject: string;
    messageHtml: string;
    eventTitle: string;
    eventDateLabel: string;
    eventLocationText: string;
    eventImageUrl: string | null;
    eventUrl: string;
    unsubscribeUrl: string;
}

export function EventCampaignEmail({
    recipientName,
    organizerName,
    subject,
    messageHtml,
    eventTitle,
    eventDateLabel,
    eventLocationText,
    eventImageUrl,
    eventUrl,
    unsubscribeUrl,
}: EventCampaignEmailProps) {
    return (
        <Html lang="fr">
            <Head />
            <Preview>{subject}</Preview>
            <Body style={body}>
                <Section style={header}>
                    <Container style={{ textAlign: "center" }}>
                        <Text style={logo}>BE</Text>
                        <Text style={logoSub}>Benin Events</Text>
                    </Container>
                </Section>

                <Container style={container}>
                    <Section style={heroSection}>
                        <Text style={badge("gold")}>📣 {organizerName}</Text>
                        <Heading style={h1}>{subject}</Heading>
                        <Text style={{ ...bodyText, fontSize: "15px" }}>
                            Bonjour {recipientName},
                        </Text>
                    </Section>

                    <Hr style={divider} />

                    {/* Message de l'organisateur */}
                    <Section style={section}>
                        <div
                            style={messageStyle}
                            dangerouslySetInnerHTML={{ __html: messageHtml }}
                        />
                    </Section>

                    <Hr style={divider} />

                    {/* Carte évènement */}
                    <Section style={section}>
                        <Section style={eventCard}>
                            {eventImageUrl && (
                                <Img
                                    src={eventImageUrl}
                                    width="520"
                                    height="200"
                                    alt={eventTitle}
                                    style={eventImg}
                                />
                            )}
                            <Text style={eventTitleStyle}>{eventTitle}</Text>
                            <Text style={eventMeta}>📅 {eventDateLabel}</Text>
                            <Text style={eventMeta}>{eventLocationText}</Text>
                            <Section style={{ marginTop: "16px" }}>
                                <Button href={eventUrl} style={ctaButtonPrimary}>
                                    Voir l&apos;évènement →
                                </Button>
                            </Section>
                        </Section>
                    </Section>

                    <Section style={footer}>
                        <Text style={footerText}>
                            Vous recevez cet email car {organizerName} a
                            lancé une campagne pour cet évènement sur{" "}
                            <a href="/" style={footerLink}>Benin Events</a>.
                        </Text>
                        <Text style={footerText}>
                            <a href={unsubscribeUrl} style={footerLink}>
                                Ne plus recevoir ce type d&apos;email
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

const messageStyle: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "15px",
    lineHeight: "1.7",
};

const eventCard: CSSProperties = {
    backgroundColor: COLORS.muted,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "12px",
    padding: "20px",
    overflow: "hidden",
};

const eventImg: CSSProperties = {
    width: "100%",
    height: "180px",
    objectFit: "cover",
    borderRadius: "8px",
    marginBottom: "14px",
    display: "block",
};

const eventTitleStyle: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "17px",
    fontWeight: "700",
    margin: "0 0 6px",
    lineHeight: "1.3",
};

const eventMeta: CSSProperties = {
    color: COLORS.mutedForeground,
    fontSize: "13px",
    margin: "0 0 4px",
};
