import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/permissions";
import {
    Calendar,
    Ticket as TicketIcon,
    MapPin,
    MonitorPlay,
    Star,
    ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import EventCountdown from "@/components/events/event-countdown";
import EventInteractions from "@/components/events/event-interactions";
import { BuyTicketButton } from "@/components/events/buy-ticket-button";

interface Props {
    params: Promise<{ slug: string }>;
}

// ─────────────────────────────────────────────
// Metadata dynamique (OG / Twitter)
// ─────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;

    const event = await prisma.event.findUnique({
        where: { slug },
        select: {
            title: true,
            ogTitle: true,
            description: true,
            ogImage: true,
            imageUrl: true,
        },
    });

    if (!event) return { title: "Évènement introuvable" };

    const ogImageUrl = event.ogImage || event.imageUrl;

    const plainDescription = event.description
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 160) + "…";

    return {
        title: `${event.ogTitle || event.title} | Benin Events`,
        description: plainDescription,
        openGraph: {
            title: event.ogTitle || event.title,
            description: plainDescription,
            images: ogImageUrl ? [ogImageUrl] : [],
        },
        twitter: {
            card: "summary_large_image",
            title: event.ogTitle || event.title,
            description: plainDescription,
            images: ogImageUrl ? [ogImageUrl] : [],
        },
    };
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function PublicEventPage({ params }: Props) {
    const { slug } = await params;
    const sessionUser = await getCurrentUser();

    // ── Fetch event ────────────────────────────────────────────────────────
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
            categories: {
                include: { category: true },
            },
            _count: {
                select: {
                    likes: true,
                    favorites: true,
                },
            },
        },
    });

    if (!event || event.isDeleted) notFound();

    // ── Statut like / favori de l'utilisateur courant ──────────────────────
    let isLiked = false;
    let isFavorited = false;
    let isLoggedIn = false;
    let buyerName: string | undefined;
    let buyerEmail: string | undefined;
    let hasExistingTicket = false;

    if (sessionUser) {
        isLoggedIn = true;
        buyerName = sessionUser.name;
        buyerEmail = sessionUser.email;

        const [like, favorite, attendeeItem, legacyOrder] = await Promise.all([
            prisma.like.findUnique({
                where: { userId_eventId: { userId: sessionUser.id, eventId: event.id } },
            }),
            prisma.favorite.findUnique({
                where: { userId_eventId: { userId: sessionUser.id, eventId: event.id } },
            }),
            // Ticket via attendeeEmail (nouveau système)
            prisma.orderItem.findFirst({
                where: {
                    attendeeEmail: sessionUser.email,
                    order: { eventId: event.id, status: "COMPLETED" },
                },
                select: { id: true },
            }),
            // Ticket via userId (ancien système ou achat sans attendeeEmail)
            prisma.order.findFirst({
                where: { userId: sessionUser.id, eventId: event.id, status: "COMPLETED" },
                select: { id: true },
            }),
        ]);

        isLiked = !!like;
        isFavorited = !!favorite;
        hasExistingTicket = !!(attendeeItem || legacyOrder);
    }

    // ── Données organisateur ───────────────────────────────────────────────
    const organizerDisplayName =
        event.organizer.organizerRequests[0]?.organizerName ||
        event.organizer.name ||
        "Organisateur anonyme";
    const organizerPhone =
        event.organizer.organizerRequests[0]?.phoneNumber || "Non renseigné";
    const organizerEmail =
        (
            event.organizer.organizerRequests[0] as {
                organizerEmail?: string;
            } | null
        )?.organizerEmail ||
        event.organizer.email ||
        "Non renseigné";

    // ── Dates ──────────────────────────────────────────────────────────────
    const isSameDay =
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

    // ── Stock restant par ticket ──────────────────────────────────────────
    const ticketsWithStock = event.tickets.filter((t) => t.totalStock !== null);
    const soldAgg =
        ticketsWithStock.length > 0
            ? await prisma.orderItem.groupBy({
                  by: ["ticketId"],
                  where: {
                      ticketId: { in: ticketsWithStock.map((t) => t.id) },
                      order: { status: { in: ["COMPLETED", "PENDING"] } },
                  },
                  _sum: { quantity: true },
              })
            : [];

    const soldMap = new Map(
        soldAgg.map((s) => [s.ticketId, s._sum.quantity ?? 0]),
    );

    const ticketsWithRemaining = event.tickets.map((ticket) => ({
        ...ticket,
        remainingStock:
            ticket.totalStock !== null
                ? Math.max(
                      0,
                      ticket.totalStock - (soldMap.get(ticket.id) ?? 0),
                  )
                : null,
    }));

    // ── Google Maps (présentiel uniquement) ───────────────────────────────
    const encodedLocation = encodeURIComponent(event.location ?? "");
    const googleMapsEmbedUrl = `https://www.google.com/maps?q=${encodedLocation}&output=embed`;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;

    // ──────────────────────────────────────────────────────────────────────
    // Render
    // ──────────────────────────────────────────────────────────────────────

    return (
        <main className="min-h-screen bg-background">
            {event.isCancelled && (
                <div className="bg-destructive text-destructive-foreground text-center py-3 px-4 text-sm font-medium">
                    Cet évènement a été annulé
                    {event.cancellationReason ? ` — ${event.cancellationReason}` : "."}
                    {" "}Les billets achetés seront remboursés.
                </div>
            )}
            {/* ══════════════════════════════════════════════════════════════
                Héro
            ══════════════════════════════════════════════════════════════ */}
            <div className="relative w-full h-[50vh] md:h-[65vh] bg-muted">
                {/* Image de couverture */}
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

                {/* Dégradé bas */}
                <div className="absolute inset-0 bg-linear-to-t from-background via-background/30 to-transparent" />

                {/* ── Retour + Badges haut gauche ───────────────────── */}
                <div className="absolute top-5 left-5 md:top-8 md:left-10 z-20 flex items-center flex-wrap gap-2">
                    {/* Bouton retour */}
                    <Link
                        href="/events"
                        aria-label="Retour aux évènements"
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white hover:bg-black/60 transition-colors shrink-0 shadow-md"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>

                    {/* Vedette */}
                    {event.isFeatured && (
                        <span className="flex items-center gap-1.5 bg-yellow-400/90 text-yellow-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm">
                            <Star className="w-3.5 h-3.5 fill-yellow-900" />
                            Évènement vedette
                        </span>
                    )}

                    {/* Type */}
                    {event.eventType === "ONLINE" ? (
                        <span className="flex items-center gap-1.5 bg-blue-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm">
                            <MonitorPlay className="w-3.5 h-3.5" />
                            En ligne
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 bg-emerald-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm">
                            <MapPin className="w-3.5 h-3.5" />
                            Présentiel
                        </span>
                    )}
                </div>

                {/* ── Contenu bas ───────────────────────────────────── */}
                <div className="absolute bottom-0 left-0 w-full px-5 pb-6 md:px-12 md:pb-10 max-w-6xl mx-auto">
                    {/* Catégories */}
                    {event.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {event.categories.map(({ category }) => (
                                <span
                                    key={category.id}
                                    className="text-xs bg-background/70 backdrop-blur-sm border border-border text-foreground font-medium px-3 py-1 rounded-full"
                                >
                                    {category.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Titre */}
                    <h1 className="text-4xl md:text-6xl font-afo text-foreground mb-5 drop-shadow-lg leading-tight">
                        {event.title}
                    </h1>

                    {/* Countdown + Interactions */}
                    <div className="flex flex-wrap items-center gap-3">
                        <EventCountdown
                            startDate={event.startDate.toISOString()}
                        />
                        <EventInteractions
                            eventId={event.id}
                            initialLikeCount={event._count.likes}
                            initialFavoriteCount={event._count.favorites}
                            initialShareCount={event.shareCount}
                            initialIsLiked={isLiked}
                            initialIsFavorited={isFavorited}
                            isLoggedIn={isLoggedIn}
                            title={event.title}
                            startDate={event.startDate.toISOString()}
                            eventType={event.eventType}
                            location={event.location}
                        />
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                Corps — grille 2 colonnes
            ══════════════════════════════════════════════════════════════ */}
            <div className="max-w-6xl mx-auto px-5 py-10 md:px-12 md:py-14 grid lg:grid-cols-[1fr_400px] gap-12">
                {/* ── Colonne gauche ───────────────────────────────────── */}
                <div className="space-y-10">
                    {/* À propos */}
                    <section>
                        <h2 className="text-4xl font-afo mb-5">
                            À propos de cet évènement
                        </h2>

                        {/* Date / heure */}
                        <div className="mb-5 inline-flex items-start gap-2 bg-muted/40 border rounded-2xl px-4 py-3 text-sm md:text-base font-medium">
                            <Calendar className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
                            <span className="flex flex-col gap-1 leading-snug">
                                <span>Début : {startLabel}</span>
                                {!isSameDay && <span>Fin : {endLabel}</span>}
                            </span>
                        </div>

                        {/* Description */}
                        <div
                            className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground"
                            dangerouslySetInnerHTML={{ __html: event.description }}
                        />
                    </section>

                    {/* ── Localisation (présentiel) OU Lien (en ligne) ─── */}
                    {event.eventType === "IN_PERSON" && event.location ? (
                        <section className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                <h2 className="text-3xl font-afo flex items-center gap-3">
                                    <MapPin className="w-7 h-7 text-emerald-500" />
                                    Localisation
                                </h2>
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
                                    className="w-full h-80 md:h-95"
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                        </section>
                    ) : event.eventType === "ONLINE" ? (
                        <section className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
                            <h2 className="text-3xl font-afo flex items-center gap-3">
                                <MonitorPlay className="w-7 h-7 text-blue-500" />
                                Accès en ligne
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Cet évènement se déroule entièrement en ligne.
                                Le lien d&apos;accès (Zoom, Google Meet,
                                YouTube Live…) vous sera communiqué par email
                                après l&apos;achat de votre billet.
                            </p>
                        </section>
                    ) : null}

                    {/* Organisateur */}
                    <section className="bg-card border rounded-2xl p-6 shadow-sm flex items-center gap-5">
                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-secondary font-bold text-2xl shrink-0">
                            {organizerDisplayName[0]?.toUpperCase() || "O"}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                                Organisé par
                            </p>
                            <p className="font-bold text-lg truncate">
                                {organizerDisplayName}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                                {organizerEmail}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {organizerPhone}
                            </p>
                        </div>
                    </section>
                </div>

                {/* ── Colonne droite : Billetterie sticky ──────────────── */}
                <div className="relative">
                    <div className="sticky top-24 space-y-6">
                        <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-xl">
                            <h3 className="text-4xl font-afo mb-6">
                                Billetterie
                            </h3>

                            {ticketsWithRemaining.length === 0 ? (
                                <p className="text-muted-foreground text-center py-6 bg-muted/30 rounded-xl border border-dashed text-sm">
                                    Aucun billet en vente pour le moment.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {ticketsWithRemaining.map((ticket) => (
                                        <div
                                            key={ticket.id}
                                            className="border border-secondary/20 rounded-2xl p-5 hover:border-secondary/50 transition-colors"
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
                                                <TicketIcon className="w-5 h-5 text-secondary shrink-0" />
                                                {ticket.title}
                                            </h4>
                                            {ticket.description && (
                                                <p className="text-sm text-muted-foreground mt-1 mb-3 leading-relaxed">
                                                    {ticket.description}
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between mt-4 gap-3">
                                                <span className="font-bold text-xl text-secondary">
                                                    {ticket.price === 0
                                                        ? "Gratuit"
                                                        : `${ticket.price.toLocaleString("fr-FR")} FCFA`}
                                                </span>
                                                {event.isCancelled ? (
                                                    <Button disabled variant="outline">
                                                        Évènement annulé
                                                    </Button>
                                                ) : (
                                                    <BuyTicketButton
                                                        eventId={event.id}
                                                        ticket={ticket}
                                                        isLoggedIn={isLoggedIn}
                                                        remainingStock={ticket.remainingStock}
                                                        buyerName={buyerName}
                                                        buyerEmail={buyerEmail}
                                                        hasExistingTicket={hasExistingTicket}
                                                    />
                                                )}
                                            </div>
                                            {ticket.remainingStock !== null && (
                                                <p className="text-xs text-muted-foreground mt-3 text-right">
                                                    Places restantes :{" "}
                                                    <span className="font-semibold text-foreground">
                                                        {ticket.remainingStock.toLocaleString(
                                                            "fr-FR",
                                                        )}
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

            {/* ══════════════════════════════════════════════════════════════
                CTA bas de page
            ══════════════════════════════════════════════════════════════ */}
            <section className="max-w-6xl mx-auto px-5 pb-12 md:px-12 md:pb-16">
                <div className="bg-card border rounded-3xl p-8 md:p-10 shadow-sm text-center">
                    <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
                        Découvrir plus
                    </p>
                    <h3 className="text-3xl md:text-4xl font-afo mb-4">
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
