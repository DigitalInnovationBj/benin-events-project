import { Button } from "@react-email/button";
import { Container } from "@react-email/container";
import { Head } from "@react-email/head";
import { Hr } from "@react-email/hr";
import { Html } from "@react-email/html";
import { Img } from "@react-email/img";
import { Link } from "@react-email/link";
import { Preview } from "@react-email/preview";
import { Section } from "@react-email/section";
import { Text } from "@react-email/text";

interface EmailTemplateProps {
  userName: string;
  message: string;
  recommendedEvents: {
    id: string;
    title: string;
    slug: string;
    location: string;
    image: string;
    startDate: string;
  }[];
}

export default function EmailTemplate({
  userName,
  message,
  recommendedEvents,
}: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>Découvrez des événements similaires à vos favoris !</Preview>
      <Container style={containerStyle}>
        <Section style={headerStyle}>
          <Text style={titleStyle}>Bonjour {userName},</Text>
          <Text style={textStyle}>{message}</Text>
        </Section>

        <Section style={contentStyle}>
          <Text style={subtitleStyle}>Événements recommandés pour vous</Text>
          {recommendedEvents.length > 0 ? (
            recommendedEvents.map((event) => (
              <Section key={event.id} style={eventCardStyle}>
                <Img
                  src={event.image}
                  alt={event.title}
                  width="100%"
                  height="150"
                  style={imageStyle}
                />
                <Text style={eventTitleStyle}>{event.title}</Text>
                <Text style={eventDetailStyle}>📍 {event.location}</Text>
                <Text style={eventDetailStyle}>
                  📅{" "}
                  {new Date(event.startDate).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
                <Button href={event.slug} style={buttonStyle}>
                  Découvrir l'événement
                </Button>
              </Section>
            ))
          ) : (
            <Text style={textStyle}>
              Aucun événement recommandé pour le moment.
            </Text>
          )}
        </Section>

        <Hr style={hrStyle} />

        <Section style={footerStyle}>
          <Text style={footerTextStyle}>
            Cet email vous a été envoyé par Benin Events.
            <br />
            <Link
              href={`${process.env.NEXT_PUBLIC_SITE_URL}/privacy`}
              style={linkStyle}
            >
              Politique de confidentialité
            </Link>{" "}
            |{" "}
            <Link
              href={`${process.env.NEXT_PUBLIC_SITE_URL}/contact`}
              style={linkStyle}
            >
              Nous contacter
            </Link>
          </Text>
        </Section>
      </Container>
    </Html>
  );
}

const containerStyle = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "20px",
  fontFamily: "'Montserrat', sans-serif",
};

const headerStyle = {
  marginBottom: "20px",
};

const titleStyle = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#B62A37",
};

const textStyle = {
  fontSize: "16px",
  color: "#333",
  lineHeight: "1.5",
};

const subtitleStyle = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#B62A37",
  marginBottom: "20px",
};

const eventCardStyle = {
  backgroundColor: "#f9f9f9",
  borderRadius: "8px",
  padding: "15px",
  marginBottom: "20px",
};

const imageStyle = {
  borderRadius: "8px",
  objectFit: "cover" as const,
};

const eventTitleStyle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#333",
  margin: "10px 0",
};

const eventDetailStyle = {
  fontSize: "14px",
  color: "#555",
  margin: "5px 0",
};

const buttonStyle = {
  backgroundColor: "#B62A37",
  color: "#fff",
  padding: "10px 20px",
  borderRadius: "5px",
  textAlign: "center" as const,
  display: "inline-block",
  fontSize: "16px",
  textDecoration: "none",
};

const hrStyle = {
  borderColor: "#ddd",
  margin: "20px 0",
};

const footerStyle = {
  textAlign: "center" as const,
  marginTop: "20px",
};

const footerTextStyle = {
  fontSize: "12px",
  color: "#777",
};

const linkStyle = {
  color: "#B62A37",
  textDecoration: "underline",
};

const contentStyle = {
  marginBottom: "20px",
};
