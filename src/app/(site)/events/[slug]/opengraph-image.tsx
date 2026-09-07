import { ImageResponse } from "next/og";
import prisma from "@/lib/prisma";
import { formatEventDateLong } from "@/lib/format";

/**
 * Image de partage générée pour les évènements sans `ogImage` ni `imageUrl`.
 *
 * Ces évènements renvoyaient auparavant `images: []` : aucun visuel
 * n'apparaissait au partage sur WhatsApp ou Facebook, ce qui est pénalisant
 * pour un produit qui se diffuse surtout par partage social.
 */

export const alt = "Évènement sur Benin Events";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    const event = await prisma.event.findUnique({
        where: { slug },
        select: {
            title: true,
            startDate: true,
            location: true,
            eventType: true,
        },
    });

    const title = event?.title ?? "Benin Events";
    const subtitle = event
        ? [
              formatEventDateLong(event.startDate),
              event.eventType === "ONLINE"
                  ? "En ligne"
                  : (event.location ?? "Bénin"),
          ].join(" · ")
        : "Les meilleurs évènements du Bénin";

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    // Violet de marque
                    background:
                        "linear-gradient(135deg, #251333 0%, #3b1d52 100%)",
                    padding: 72,
                    color: "#ffffff",
                    fontFamily: "sans-serif",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        fontSize: 30,
                        fontWeight: 700,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                        color: "#f0b840",
                    }}
                >
                    Benin Events
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                    <div
                        style={{
                            display: "flex",
                            fontSize: title.length > 60 ? 62 : 80,
                            fontWeight: 800,
                            lineHeight: 1.1,
                        }}
                    >
                        {title.length > 100
                            ? `${title.slice(0, 100)}…`
                            : title}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            marginTop: 28,
                            fontSize: 32,
                            color: "rgba(255,255,255,0.72)",
                        }}
                    >
                        {subtitle}
                    </div>
                </div>
            </div>
        ),
        size,
    );
}
