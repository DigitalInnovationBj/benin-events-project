import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Ticket as TicketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventCountdown from "@/components/events/event-countdown";
import ShareEventButton from "@/components/events/share-event-button";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;

    const event = await prisma.event.findUnique({
        where: { slug },
    });

    if (!event) return { title: "Évènement introuvable" };

    return {
        title: `${event.ogTitle || event.title} | Benin Events`,
        description: event.description.substring(0, 160) + "...",
        openGraph: {
            title: event.ogTitle || event.title,
            description: event.description.substring(0, 160) + "...",
            images:
                event.ogImage || event.imageUrl
                    ? [event.ogImage || (event.imageUrl as string)]
                    : [],
        },
        twitter: {
            card: "summary_large_image",
            title: event.ogTitle || event.title,
            description: event.description.substring(0, 160) + "...",
            images:
                event.ogImage || event.imageUrl
                    ? [event.ogImage || (event.imageUrl as string)]
                    : [],
        },
    };
}

export default async function PublicEventPage({ params }: Props) {
    const { slug } = await params;

    const event = await prisma.event.findUnique({
        where: { slug },
        include: {
            organizer: {
                include: {
                    organizerRequests: {
                        where: { status: "APPROVED" },
                        orderBy: { createdAt: "desc" },
                        take: 1,
                    },
                },
            },
            tickets: true,
        },
    });

    if (!event) {
        notFound();
    }

    const organizerDisplayName =
        event.organizer.organizerRequests[0]?.organizerName ||
        event.organizer.name ||
        "Organisateur anonyme";
    const organizerPhone =
        event.organizer.organizerRequests[0]?.phoneNumber || "Non renseigné";
    const organizerEmail =
        (event.organizer.organizerRequests[0] as { organizerEmail?: string })
            ?.organizerEmail ||
        event.organizer.email ||
        "Non renseigné";
    const encodedLocation = encodeURIComponent(event.location);
    const googleMapsEmbedUrl = `https://www.google.com/maps?q=${encodedLocation}&output=embed`;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
    const isSameStartEndDay =
        event.startDate.toDateString() === event.endDate.toDateString();
    const startLabel = new Date(event.startDate).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Porto-Novo",
    });
    const endLabel = new Date(event.endDate).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Porto-Novo",
    });
    const endTimeLabel = new Date(event.endDate).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Porto-Novo",
    });

    return (
        <main className="min-h-screen bg-background">
            {/* Héro Section */}
            <div className="relative w-full h-[40vh] md:h-[60vh] bg-muted">
                {event.imageUrl ? (
                    <Image
                        src={event.imageUrl}
                        alt={event.title}
                        fill
                        priority
                        className="object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        Aucune image fournie
                    </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-background via-background/20 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 max-w-6xl mx-auto">
                    <h1 className="text-6xl font-afo text-foreground mb-4 drop-shadow-lg">
                        {event.title}
                    </h1>
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <EventCountdown
                            startDate={event.startDate.toISOString()}
                        />
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm md:text-base font-medium"></div>
                </div>
            </div>

            {/* Contenu */}
            <div className="max-w-6xl mx-auto p-6 md:p-12 grid lg:grid-cols-[1fr_400px] gap-12">
                <div className="space-y-10">
                    <section>
                        <h2 className="text-4xl font-afo mb-4">
                            À propos de cet évènement
                        </h2>
                        <div className="mb-4 inline-flex items-start gap-2 bg-muted/40 border rounded-2xl px-4 py-3 text-sm md:text-base font-medium">
                            <Calendar className="w-5 h-5 text-secondary" />
                            <span className="flex flex-col gap-1 leading-tight">
                                <span>Début: {startLabel}</span>
                                {!isSameStartEndDay && <span>Fin: {endLabel}</span>}
                            </span>
                        </div>
                        <div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap text-muted-foreground">
                            {event.description}
                        </div>
                    </section>

                    <section className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="text-3xl font-afo">Localisation</h2>
                            <a
                                href={googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-secondary hover:underline"
                            >
                                Ouvrir sur Google Maps
                            </a>
                        </div>
                        <p className="text-muted-foreground">
                            {event.location}
                        </p>
                        <div className="overflow-hidden rounded-xl border">
                            <iframe
                                title={`Carte de ${event.location}`}
                                src={googleMapsEmbedUrl}
                                className="w-full h-[320px] md:h-[380px]"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    </section>

                    <section className="bg-card border rounded-2xl p-6 shadow-sm flex items-center gap-4">
                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-secondary font-bold text-xl">
                            {organizerDisplayName[0] || "O"}
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Organisé par
                            </p>
                            <p className="font-bold text-lg">
                                {organizerDisplayName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {organizerEmail}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {organizerPhone}
                            </p>
                        </div>
                        <ShareEventButton
                            title={event.title}
                            className="ml-auto rounded-full"
                        />
                    </section>
                </div>

                {/* Billetterie Sticky Sidebar */}
                <div className="relative">
                    <div className="sticky top-24 space-y-6">
                        <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-xl">
                            <h3 className="text-4xl font-afo mb-6">
                                Billetterie
                            </h3>

                            {event.tickets.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4 bg-muted/30 rounded-xl border border-dashed">
                                    Aucun billet en vente pour le moment.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {event.tickets.map((ticket) => (
                                        <div
                                            key={ticket.id}
                                            className="border border-secondary/20 rounded-2xl p-5 hover:border-secondary/40 transition-colors"
                                        >
                                            {ticket.imageUrl && (
                                                <div className="relative w-full h-44 mb-4 overflow-hidden rounded-xl bg-muted">
                                                    <Image
                                                        src={ticket.imageUrl}
                                                        alt={ticket.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            )}
                                            <h4 className="font-bold text-lg flex items-center gap-2">
                                                <TicketIcon className="w-6 h-6 text-secondary" />
                                                {ticket.title}
                                            </h4>
                                            {ticket.description && (
                                                <p className="text-sm text-muted-foreground mt-1 mb-3">
                                                    {ticket.description}
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between mt-4">
                                                <span className="font-bold text-xl text-secondary">
                                                    {ticket.price === 0
                                                        ? "Gratuit"
                                                        : `${ticket.price} FCFA`}
                                                </span>
                                                <Button>Acheter</Button>
                                            </div>
                                            {ticket.totalStock && (
                                                <p className="text-xs text-muted-foreground mt-3 text-right">
                                                    Restant :{" "}
                                                    <span className="font-medium text-foreground">
                                                        {ticket.totalStock}
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <section className="max-w-6xl mx-auto px-6 pb-12 md:px-12 md:pb-16">
                <div className="bg-card border rounded-3xl p-8 md:p-10 shadow-sm text-center">
                    <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
                        Découvrir plus
                    </p>
                    <h3 className="text-4xl md:text-4xl font-afo mb-4">
                        Tu veux voir d&apos;autres évènements ?
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                        Explore tous les évènements disponibles et trouve ta
                        prochaine sortie.
                    </p>
                    <Button asChild size="lg" variant="secondary">
                        <Link href="/events">Voir tous les évènements</Link>
                    </Button>
                </div>
            </section>
        </main>
    );
}
