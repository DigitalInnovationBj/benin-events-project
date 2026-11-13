import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getRemainingStock } from "@/lib/stock";
import {
    IconCalendar,
    IconMapPin,
    IconDeviceTvOld,
    IconStar,
    IconArrowLeft,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import EventCountdown from "@/components/events/event-countdown";
import EventInteractions from "@/components/events/event-interactions";
import { TicketSelector } from "@/components/events/ticket-selector";
import { TicketsAnchorButton } from "@/components/events/tickets-anchor-button";
import { EventJsonLd } from "@/components/events/event-json-ld";
import { asEventTheme } from "@/themes/registry";
import {
    AdjatcheBanner,
    AdjatcheCtaDecor,
    AdjatcheOrganizers,
    AdjatcheTagline,
    AdjatcheTicketsHeader,
    adjatchePattern,
    adjatcheRootClass,
} from "@/themes/adjatche/page-parts";

interface Props {
    params: Promise<{ slug: string }>;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Description en texte brut, pour les métadonnées et les données structurées. */
function toPlainDescription(html: string): string {
    return (
        html
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .substring(0, 160) + "…"
    );
}

// Le stock affiché et les compteurs sociaux tolèrent quelques minutes de
// décalage ; l'état propre à l'utilisateur (like, favori) est lu côté client.
export const revalidate = 300;

/**
 * Prérend les évènements à venir.
 *
 * `dynamicParams` reste à sa valeur par défaut (true) : un évènement publié
 * après le build, ou passé, est rendu à la demande puis mis en cache.
 */
export async function generateStaticParams() {
    const events = await prisma.event.findMany({
        where: {
            isPublished: true,
            isDeleted: false,
            isCancelled: false,
            endDate: { gte: new Date() },
        },
        select: { slug: true },
        orderBy: { startDate: "asc" },
        // Borné : le build ne doit pas dépendre de la taille du catalogue.
        take: 200,
    });

    return events.map(({ slug }) => ({ slug }));
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

    const plainDescription = toPlainDescription(event.description);

    return {
        // Le template du layout racine ajoute déjà « | Benin Events ».
        title: event.ogTitle || event.title,
        description: plainDescription,
        // Sans canonical par page, toutes les pages héritaient de celui du
        // layout, qui pointe vers l'accueil.
        alternates: { canonical: `/events/${slug}` },
        openGraph: {
            type: "article",
            title: event.ogTitle || event.title,
            description: plainDescription,
            url: `/events/${slug}`,
            // `images` omis quand il n'y en a pas : Next retombe alors sur
            // l'opengraph-image générée du segment.
            ...(ogImageUrl ? { images: [ogImageUrl] } : {}),
        },
        twitter: {
            card: "summary_large_image",
            title: event.ogTitle || event.title,
            description: plainDescription,
            ...(ogImageUrl ? { images: [ogImageUrl] } : {}),
        },
    };
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function PublicEventPage({ params }: Props) {
    const { slug } = await params;

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
    // Même règle que initiateTicketPayment (cf. src/lib/stock.ts) : le nombre
    // annoncé ici est exactement celui que le serveur appliquera à l'achat.
    const remainingByTicket = await getRemainingStock(
        event.tickets.map((t) => t.id),
    );

    const plainDescription = toPlainDescription(event.description);
    // Habillage personnalisé (même gabarit, autre charte graphique).
    const isAdjatche = asEventTheme(event.theme) === "adjatche";

    const ticketsWithRemaining = event.tickets.map((ticket) => ({
        ...ticket,
        remainingStock: remainingByTicket.get(ticket.id) ?? null,
    }));

    // Prix d'appel du raccourci mobile : le billet le moins cher encore en vente.
    const availablePrices = ticketsWithRemaining
        .filter((t) => t.remainingStock === null || t.remainingStock > 0)
        .map((t) => t.price);
    const fromPrice =
        availablePrices.length > 0 ? Math.min(...availablePrices) : null;

    // ── Google Maps (présentiel uniquement) ───────────────────────────────
    const encodedLocation = encodeURIComponent(event.location ?? "");
    const googleMapsEmbedUrl = `https://www.google.com/maps?q=${encodedLocation}&output=embed`;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;

    // ──────────────────────────────────────────────────────────────────────
    // Render
    // ──────────────────────────────────────────────────────────────────────

    return (
        <div className={isAdjatche ? `${adjatcheRootClass} bg-background` : "bg-background"}>
            <EventJsonLd
                url={`${APP_URL}/events/${event.slug}`}
                title={event.title}
                description={plainDescription}
                imageUrl={event.ogImage || event.imageUrl}
                startDate={event.startDate}
                endDate={event.endDate}
                eventType={event.eventType}
                location={event.location}
                isCancelled={event.isCancelled}
                organizerName={event.organizer.name}
                tickets={ticketsWithRemaining.map((t) => ({
                    title: t.title,
                    price: t.price,
                    remainingStock: t.remainingStock,
                }))}
            />

            {event.isCancelled && (
                <div className="bg-destructive text-destructive-foreground text-center py-3 px-4 text-sm font-medium">
                    Cet évènement a été annulé
                    {event.cancellationReason ? ` — ${event.cancellationReason}` : "."}
                    {" "}Les billets achetés seront remboursés.
                </div>
            )}
            {/* ══════════════════════════════════════════════════════════════
                Bannière — l'image ne porte plus que le retour et les badges.
                Titre, catégories et compteur vivaient en surimpression : sur
                mobile ils se chevauchaient et devenaient illisibles.
            ══════════════════════════════════════════════════════════════ */}
            <div className="relative w-full h-56 sm:h-72 md:h-104 bg-muted">
                {isAdjatche ? (
                    <AdjatcheBanner />
                ) : event.imageUrl ? (
                    <Image
                        src={event.imageUrl}
                        alt=""
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <IconCalendar
                            className="h-16 w-16 text-muted-foreground/30"
                            aria-hidden="true"
                        />
                    </div>
                )}

                {/* Fondu vers le fond de page, pour raccorder image et contenu */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background to-transparent" />

                {/* Retour + badges */}
                <div className="absolute inset-x-0 top-0 z-10">
                    <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-5 pt-5 md:px-12 md:pt-8">
                        <Link
                            href="/events"
                            aria-label="Retour aux évènements"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-black/60"
                        >
                            <IconArrowLeft className="h-4 w-4" aria-hidden="true" />
                        </Link>

                        {event.isFeatured && (
                            <span className="flex items-center gap-1.5 rounded-full bg-yellow-400/90 px-3 py-1.5 text-xs font-bold text-yellow-900 shadow-md backdrop-blur-sm">
                                <IconStar
                                    className="h-3.5 w-3.5 fill-yellow-900"
                                    aria-hidden="true"
                                />
                                Vedette
                            </span>
                        )}

                        {event.eventType === "ONLINE" ? (
                            <span className="flex items-center gap-1.5 rounded-full bg-blue-500/90 px-3 py-1.5 text-xs font-bold text-white shadow-md backdrop-blur-sm">
                                <IconDeviceTvOld
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                />
                                En ligne
                            </span>
                        ) : (
                            <span className={isAdjatche
                                ? "flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground shadow-md"
                                : "flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1.5 text-xs font-bold text-white shadow-md backdrop-blur-sm"}>
                                <IconMapPin
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                />
                                Présentiel
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                En-tête — titre et informations clés, hors de l'image
            ══════════════════════════════════════════════════════════════ */}
            <header className="mx-auto max-w-6xl px-5 pt-6 md:px-12 md:pt-8">
                {event.categories.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                        {event.categories.map(({ category }) => (
                            <span
                                key={category.id}
                                className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-secondary"
                            >
                                {category.name}
                            </span>
                        ))}
                    </div>
                )}

                <h1 className="font-afo text-3xl leading-tight sm:text-4xl md:text-6xl">
                    {event.title}
                </h1>
                {isAdjatche && <AdjatcheTagline />}

                {/* Date et lieu : les deux informations que l'on cherche en premier */}
                <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
                    <span className="flex items-start gap-2">
                        <IconCalendar
                            className="mt-0.5 h-4 w-4 shrink-0 text-secondary"
                            aria-hidden="true"
                        />
                        <span>
                            {startLabel}
                            {!isSameDay && (
                                <span className="block sm:inline">
                                    <span className="hidden sm:inline"> — </span>
                                    {endLabel}
                                </span>
                            )}
                        </span>
                    </span>

                    {event.eventType === "IN_PERSON" && event.location && (
                        <span className="flex items-start gap-2">
                            <IconMapPin
                                className="mt-0.5 h-4 w-4 shrink-0"
                                aria-hidden="true"
                            />
                            {event.location}
                        </span>
                    )}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                    <EventCountdown startDate={event.startDate.toISOString()} />
                    <EventInteractions
                        eventId={event.id}
                        initialLikeCount={event._count.likes}
                        initialFavoriteCount={event._count.favorites}
                        initialShareCount={event.shareCount}
                        title={event.title}
                        startDate={event.startDate.toISOString()}
                        eventType={event.eventType}
                        location={event.location}
                    />
                </div>
            </header>

            {/* ══════════════════════════════════════════════════════════════
                Corps — grille 2 colonnes
            ══════════════════════════════════════════════════════════════ */}
            <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 md:px-12 md:py-12 lg:grid-cols-[1fr_380px] lg:gap-12">
                {/* ── Colonne gauche ───────────────────────────────────── */}
                <div className="space-y-10">
                    {/* À propos */}
                    <section>
                        <h2 className="mb-4 font-afo text-2xl sm:text-3xl">
                            À propos
                        </h2>

                        {/* Description */}
                        <div
                            className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-muted-foreground"
                            dangerouslySetInnerHTML={{ __html: event.description }}
                        />
                    </section>

                    {/* ── Localisation (présentiel) OU Lien (en ligne) ─── */}
                    {event.eventType === "IN_PERSON" && event.location ? (
                        <section className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                <h2 className="flex items-center gap-2.5 font-afo text-2xl sm:text-3xl">
                                    <IconMapPin className={isAdjatche ? "h-6 w-6 shrink-0 text-secondary" : "h-6 w-6 shrink-0 text-emerald-500"} />
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
                                    className="h-64 w-full sm:h-80"
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                        </section>
                    ) : event.eventType === "ONLINE" ? (
                        <section className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
                            <h2 className="flex items-center gap-2.5 font-afo text-2xl sm:text-3xl">
                                <IconDeviceTvOld className="h-6 w-6 shrink-0 text-blue-500" />
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
                    {isAdjatche ? (
                        <AdjatcheOrganizers email={organizerEmail} />
                    ) : (
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
                    )}
                </div>

                {/* ── Colonne droite : Billetterie sticky ──────────────── */}
                <div className="relative">
                    {/* `scroll-mt-20` dégage la navbar collante quand on
                        arrive ici via le raccourci flottant. */}
                    <div
                        id="billetterie"
                        className="sticky top-24 space-y-6 scroll-mt-20"
                    >
                        <div className={isAdjatche ? "bg-card border rounded-3xl shadow-xl overflow-hidden" : "bg-card border rounded-3xl p-6 md:p-8 shadow-xl"}>
                            {isAdjatche && <AdjatcheTicketsHeader />}
                            <div className={isAdjatche ? "p-6 md:p-8" : undefined}>
                            <h3 className="mb-5 font-afo text-3xl">
                                Billetterie
                            </h3>

                            <TicketSelector
                                eventSlug={event.slug}
                                isCancelled={event.isCancelled}
                                tickets={ticketsWithRemaining.map((t) => ({
                                    id: t.id,
                                    title: t.title,
                                    description: t.description,
                                    price: t.price,
                                    imageUrl: t.imageUrl,
                                    remainingStock: t.remainingStock,
                                }))}
                            />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {!event.isCancelled && ticketsWithRemaining.length > 0 && (
                <TicketsAnchorButton
                    targetId="billetterie"
                    fromPrice={fromPrice}
                />
            )}

            {/* ══════════════════════════════════════════════════════════════
                CTA bas de page
            ══════════════════════════════════════════════════════════════ */}
            <section className="max-w-6xl mx-auto px-5 pb-12 md:px-12 md:pb-16">
                <div
                    className={isAdjatche ? "relative overflow-hidden border rounded-3xl p-8 md:p-10 shadow-sm text-center" : "bg-card border rounded-3xl p-8 md:p-10 shadow-sm text-center"}
                    style={isAdjatche ? adjatchePattern : undefined}
                >
                    {isAdjatche && <AdjatcheCtaDecor />}
                    <div className="relative">
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
                </div>
            </section>
        </div>
    );
}
