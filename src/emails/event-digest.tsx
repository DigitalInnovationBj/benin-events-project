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
}

const CONFIG: Record<DigestType, { preview: string; badge: string; heading: string; intro: string }> = {
    recommendations: {
        preview: "Des évènements sélectionnés pour vous",
        badge: "🎯 Recommandations personnalisées",
        heading: "Sélectionnés pour vous",
        intro: "Basé sur vos centres d'intérêt, voici les évènements à ne pas manquer :",
    },
    weekend: {
        preview: "Ce qui se passe ce week-end",
        badge: "🌅 Programme du week-end",
        heading: "Ce week-end à Bénin Events",
        intro: "Voici les évènements qui ont lieu ce week-end :",
    },
    week: {
        preview: "Les évènements de la semaine",
        badge: "📅 Programme de la semaine",
        heading: "Cette semaine sur Bénin Events",
        intro: "Découvrez ce qui se passe cette semaine :",
    },
};

export function EventDigestEmail({ userName, digestType, events, appUrl }: EventDigestEmailProps) {
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

                <Container style={container}>
                    <Text style={badge}>{cfg.badge}</Text>
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
                                Voir l'évènement →
                            </Button>
                        </Section>
                    ))}

                    <Hr style={divider} />

                    <Section style={{ textAlign: "center", paddingBottom: "8px" }}>
                        <Button href={`${appUrl}/events`} style={allEventsBtn}>
                            Voir tous les évènements
                        </Button>
                    </Section>

                    <Text style={footer}>
                        Vous recevez cet email parce que vous êtes inscrit sur{" "}
                        <a href={appUrl} style={link}>beninevents.com</a>.
                        Pour ne plus recevoir ces notifications, écrivez-nous à{" "}
                        <a href="mailto:support@beninevents.com" style={link}>
                            support@beninevents.com
                        </a>.
                    </Text>
                </Container>
            </Body>
        </Html>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
    backgroundColor: "#f4f4f5",
    fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
    margin: 0,
    padding: 0,
};
const header: React.CSSProperties = {
    backgroundColor: "#09090b",
    padding: "24px 0",
    textAlign: "center",
};
const logo: React.CSSProperties = {
    color: "#d4af37",
    fontSize: "28px",
    fontWeight: "900",
    letterSpacing: "4px",
    margin: "0 0 2px 0",
};
const logoSub: React.CSSProperties = {
    color: "#a1a1aa",
    fontSize: "11px",
    letterSpacing: "3px",
    textTransform: "uppercase",
    margin: 0,
};
const container: React.CSSProperties = {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    margin: "24px auto",
    maxWidth: "580px",
    padding: "32px 40px",
};
const badge: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: "600",
    color: "#52525b",
    margin: "0 0 10px 0",
};
const heading: React.CSSProperties = {
    color: "#09090b",
    fontSize: "22px",
    fontWeight: "700",
    margin: "0 0 8px 0",
};
const subtitle: React.CSSProperties = {
    color: "#52525b",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0 0 4px 0",
};
const divider: React.CSSProperties = {
    borderColor: "#e4e4e7",
    margin: "24px 0",
};
const card: React.CSSProperties = {
    backgroundColor: "#fafafa",
    border: "1px solid #e4e4e7",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "16px",
    overflow: "hidden",
};
const cardImg: React.CSSProperties = {
    width: "100%",
    height: "180px",
    objectFit: "cover",
    borderRadius: "8px",
    marginBottom: "14px",
    display: "block",
};
const cardTitle: React.CSSProperties = {
    color: "#09090b",
    fontSize: "17px",
    fontWeight: "700",
    margin: "0 0 6px 0",
    lineHeight: "1.3",
};
const cardMeta: React.CSSProperties = {
    color: "#52525b",
    fontSize: "13px",
    margin: "0 0 4px 0",
};
const cardCats: React.CSSProperties = {
    color: "#d4af37",
    fontSize: "12px",
    fontWeight: "600",
    margin: "6px 0",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
};
const cardPrice: React.CSSProperties = {
    color: "#3f3f46",
    fontSize: "13px",
    fontWeight: "600",
    margin: "8px 0 14px 0",
};
const ctaBtn: React.CSSProperties = {
    backgroundColor: "#d4af37",
    borderRadius: "8px",
    color: "#09090b",
    display: "inline-block",
    fontSize: "13px",
    fontWeight: "700",
    padding: "10px 20px",
    textDecoration: "none",
};
const allEventsBtn: React.CSSProperties = {
    backgroundColor: "#09090b",
    borderRadius: "8px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "13px",
    fontWeight: "600",
    padding: "10px 24px",
    textDecoration: "none",
};
const footer: React.CSSProperties = {
    color: "#a1a1aa",
    fontSize: "11px",
    lineHeight: "1.6",
    marginTop: "24px",
    textAlign: "center",
};
const link: React.CSSProperties = { color: "#d4af37", textDecoration: "none" };
