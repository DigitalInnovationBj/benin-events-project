/**
 * Données structurées schema.org pour un évènement.
 *
 * C'est ce qui rend un évènement éligible aux « rich results » Google Events
 * (encart avec date, lieu et prix directement dans les résultats) — le levier
 * SEO le plus rentable pour une billetterie, et il était absent.
 */

type JsonLdTicket = {
    title: string;
    price: number;
    remainingStock: number | null;
};

interface Props {
    url: string;
    title: string;
    description: string;
    imageUrl: string | null;
    startDate: Date;
    endDate: Date;
    eventType: string;
    location: string | null;
    isCancelled: boolean;
    organizerName: string | null;
    tickets: JsonLdTicket[];
}

/** Le Bénin est à UTC+1 toute l'année : l'offset est constant. */
const UTC_OFFSET = "+01:00";

function toLocalIso(date: Date): string {
    // schema.org attend une date ISO 8601 avec offset. `toISOString()` rendrait
    // du UTC ; on décale pour exprimer l'heure locale de l'évènement.
    const shifted = new Date(date.getTime() + 60 * 60 * 1000);
    return shifted.toISOString().replace(/\.\d{3}Z$/, UTC_OFFSET);
}

export function EventJsonLd({
    url,
    title,
    description,
    imageUrl,
    startDate,
    endDate,
    eventType,
    location,
    isCancelled,
    organizerName,
    tickets,
}: Props) {
    const isOnline = eventType === "ONLINE";

    const offers = tickets.map((ticket) => ({
        "@type": "Offer",
        name: ticket.title,
        price: ticket.price,
        priceCurrency: "XOF",
        url,
        availability:
            ticket.remainingStock !== null && ticket.remainingStock <= 0
                ? "https://schema.org/SoldOut"
                : "https://schema.org/InStock",
    }));

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Event",
        name: title,
        description,
        url,
        startDate: toLocalIso(startDate),
        endDate: toLocalIso(endDate),
        eventStatus: isCancelled
            ? "https://schema.org/EventCancelled"
            : "https://schema.org/EventScheduled",
        eventAttendanceMode: isOnline
            ? "https://schema.org/OnlineEventAttendanceMode"
            : "https://schema.org/OfflineEventAttendanceMode",
        ...(imageUrl ? { image: [imageUrl] } : {}),
        location: isOnline
            ? { "@type": "VirtualLocation", url }
            : {
                  "@type": "Place",
                  name: location ?? "Lieu à confirmer",
                  address: {
                      "@type": "PostalAddress",
                      addressLocality: location ?? undefined,
                      addressCountry: "BJ",
                  },
              },
        ...(organizerName
            ? {
                  organizer: {
                      "@type": "Organization",
                      name: organizerName,
                  },
              }
            : {}),
        ...(offers.length > 0 ? { offers } : {}),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serialize(jsonLd) }}
        />
    );
}

/**
 * Sérialise en neutralisant `<`.
 *
 * Les titres et descriptions sont saisis par les organisateurs : un
 * `</script>` dans l'un d'eux fermerait la balise et permettrait d'injecter
 * du HTML dans la page. Échapper `<` en `<` reste du JSON valide.
 */
function serialize(value: unknown): string {
    return JSON.stringify(value).replace(/</g, "\\u003c");
}
