import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import {
    badge,
    body,
    containerCard,
    ctaButtonPrimary,
    ctaButtonSecondary,
    footerLink,
    header,
    logo,
    logoSub,
    COLORS,
} from "./_theme";
import type { CSSProperties } from "react";

export type DigestType = "recommendations" | "weekend" | "week";

export interface DigestEvent {
    title: string;
    slug: string;
    dateLabel: string;
    location: string | null;
    eventType: "IN_PERSON" | "ONLINE";
    imageUrl: string | null;
    minPrice: number;
    categories: string[];
}

export interface EventDigestEmailProps {
    userName: string;
    digestType: DigestType;
    events: DigestEvent[];
    appUrl: string;
    /** Lien de désinscription signé, propre à chaque destinataire */
    unsubscribeUrl?: string;
}

const CONFIG: Record<DigestType, { preview: string; badgeLabel: string; heading: string; intro: string }> = {
    recommendations: {
        preview: "Des évènements sélectionnés pour vous",
        badgeLabel: "🎯 Recommandations personnalisées",
        heading: "Sélectionnés pour vous",
        intro: "Basé sur vos centres d'intérêt, voici les évènements à ne pas manquer :",
    },
    weekend: {
        preview: "Ce qui se passe ce week-end",
        badgeLabel: "🌅 Programme du week-end",
        heading: "Ce week-end à Bénin Events",
        intro: "Voici les évènements qui ont lieu ce week-end :",
    },
    week: {
        preview: "Les évènements de la semaine",
        badgeLabel: "📅 Programme de la semaine",
        heading: "Cette semaine sur Bénin Events",
        intro: "Découvrez ce qui se passe cette semaine :",
    },
};

export function EventDigestEmail({ userName, digestType, events, appUrl, unsubscribeUrl }: EventDigestEmailProps) {
    const cfg = CONFIG[digestType];

    return (
        <Html lang="fr">
            <Head />
            <Preview>{cfg.preview}</Preview>
            <Body style={body}>
                {/* Header */}
                <Section style={header}>
                    <Container style={{ textAlign: "center" }}>
                        <Text style={logo}>BE</Text>
                        <Text style={logoSub}>Benin Events</Text>
                    </Container>
                </Section>

                <Container style={containerCard}>
                    <Text style={badge("brand")}>{cfg.badgeLabel}</Text>
                    <Heading style={heading}>Bonjour {userName} 👋</Heading>
                    <Text style={subtitle}>{cfg.intro}</Text>

                    <Hr style={divider} />

                    {/* Event cards */}
                    {events.map((event) => (
                        <Section key={event.slug} style={card}>
                            {event.imageUrl && (
                                <Img
                                    src={event.imageUrl}
                                    width="520"
                                    height="200"
                                    alt={event.title}
                                    style={cardImg}
                                />
                            )}
                            <Text style={cardTitle}>{event.title}</Text>
                            <Text style={cardMeta}>
                                📅 {event.dateLabel}
                            </Text>
                            <Text style={cardMeta}>
                                {event.eventType === "ONLINE"
                                    ? "🌐 Évènement en ligne"
                                    : `📍 ${event.location ?? "Lieu à confirmer"}`}
                            </Text>
                            {event.categories.length > 0 && (
                                <Text style={cardCats}>
                                    {event.categories.join(" · ")}
                                </Text>
                            )}
                            <Text style={cardPrice}>
                                {event.minPrice === 0
                                    ? "🎟 Entrée gratuite"
                                    : `🎟 À partir de ${event.minPrice.toLocaleString("fr-FR")} FCFA`}
                            </Text>
                            <Button href={`${appUrl}/events/${event.slug}`} style={ctaBtn}>
                                Voir l&apos;évènement →
                            </Button>
                        </Section>
                    ))}

                    <Hr style={divider} />

                    <Section style={{ textAlign: "center", paddingBottom: "8px" }}>
                        <Button href={`${appUrl}/events`} style={ctaButtonPrimary}>
                            Voir tous les évènements
                        </Button>
                    </Section>

                    <Text style={footer}>
                        Vous recevez cet email parce que vous êtes inscrit sur{" "}
                        <a href={appUrl} style={footerLink}>beninevents.com</a>.
                        {unsubscribeUrl ? (
                            <>
                                {" "}Pour ne plus recevoir ces emails,{" "}
                                <a href={unsubscribeUrl} style={footerLink}>
                                    cliquez ici pour vous désinscrire
                                </a>.
                            </>
                        ) : (
                            <>
                                {" "}Pour ne plus recevoir ces notifications, écrivez-nous à{" "}
                                <a href="mailto:beninevents.officiel@gmail.com" style={footerLink}>
                                    beninevents.officiel@gmail.com
                                </a>.
                            </>
                        )}
                    </Text>
                </Container>
            </Body>
        </Html>
    );
}

// ─────────────────────────────────────────────
// Styles spécifiques à cet email
// ─────────────────────────────────────────────

const heading: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "22px",
    fontWeight: "700",
    margin: "0 0 8px",
};
const subtitle: CSSProperties = {
    color: COLORS.mutedForeground,
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0 0 4px",
};
const divider: CSSProperties = {
    borderColor: COLORS.border,
    margin: "24px 0",
};
const card: CSSProperties = {
    backgroundColor: COLORS.muted,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "16px",
    overflow: "hidden",
};
const cardImg: CSSProperties = {
    width: "100%",
    height: "180px",
    objectFit: "cover",
    borderRadius: "8px",
    marginBottom: "14px",
    display: "block",
};
const cardTitle: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "17px",
    fontWeight: "700",
    margin: "0 0 6px",
    lineHeight: "1.3",
};
const cardMeta: CSSProperties = {
    color: COLORS.mutedForeground,
    fontSize: "13px",
    margin: "0 0 4px",
};
const cardCats: CSSProperties = {
    color: COLORS.primary,
    fontSize: "12px",
    fontWeight: "600",
    margin: "6px 0",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
};
const cardPrice: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "13px",
    fontWeight: "600",
    margin: "8px 0 14px",
};
const ctaBtn: CSSProperties = { ...ctaButtonSecondary, fontSize: "13px", padding: "10px 20px", borderRadius: "8px" };
const footer: CSSProperties = {
    color: COLORS.mutedForeground,
    fontSize: "11px",
    lineHeight: "1.6",
    marginTop: "24px",
    textAlign: "center",
};
