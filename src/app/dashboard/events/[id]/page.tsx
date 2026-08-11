import { getCurrentUser } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Ticket as TicketIcon,
    Calendar,
    Download,
    MapPin,
    MonitorPlay,
    Pencil,
    Plus,
    Star,
    Users,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import { TicketForm } from "./ticket-form";
import { TicketEditDialog } from "./ticket-edit-dialog";
import DeleteEventButton from "./DeleteEventButton";
import CancelEventButton from "./CancelEventButton";
import RefundPanel from "./RefundPanel";
import { FeaturedButton } from "./FeaturedButton";
import { CampaignDialog } from "./CampaignDialog";
import { EventPartnersPanel } from "./EventPartnersPanel";
import { getSettings } from "@/actions/settings.actions";
import { getOrdersToRefund } from "@/actions/payment.actions";
import { getCampaignsForEvent } from "@/actions/campaign.actions";
import { listEventPartners } from "@/actions/eventPartner.actions";

// Laisse plus de marge à l'envoi de campagne en tâche de fond (next/server `after`).
export const maxDuration = 60;

export default async function EventDetailsPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ created?: string; featured?: string; featured_error?: string }>;
}) {
    const [{ id }, sp] = await Promise.all([params, searchParams]);
    const dbUser = await getCurrentUser();

    if (!dbUser) redirect("/sign-in");

    if (dbUser.role !== "ORGANIZER" && dbUser.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const [event, settings] = await Promise.all([
        prisma.event.findUnique({
            where: { id },
            include: {
                tickets: true,
                categories: { include: { category: true } },
            },
        }),
        getSettings(),
    ]);

    const { remaining: campaignsRemaining, nextAvailableAt: campaignNextAvailableAt } =
        event ? await getCampaignsForEvent(event.id) : { remaining: 0, nextAvailableAt: null };

    const { partners: eventPartners } = event
        ? await listEventPartners(event.id)
        : { partners: [] };

    if (!event) {
        return (
            <div className="max-w-5xl mx-auto py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">
                    Évènement introuvable
                </h1>
                <Link href="/dashboard/events">
                    <Button>Retour aux évènements</Button>
                </Link>
            </div>
        );
    }

    if (dbUser.role !== "ADMIN" && event.organizerId !== dbUser.id) {
        redirect("/dashboard/events");
    }

    const showCreatedSuccess = sp.created === "1";
    const showFeaturedSuccess = sp.featured === "1";
    const showFeaturedError = sp.featured_error === "1";
    const canFeature =
        settings.featuredEventFeeEnabled &&
        dbUser.role === "ORGANIZER" &&
        !event.isFeatured;

    const { orders: ordersToRefund } = event.isCancelled
        ? await getOrdersToRefund(event.id)
        : { orders: [] };

    return (
        <div className="max-w-5xl mx-auto w-full pb-20">
            {/* ── Bannières contextuelles ───────────────────────── */}
            {showCreatedSuccess && (
                <div className="mb-5 flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-emerald-800 dark:text-emerald-200 font-medium">
                        Paiement confirmé — votre évènement est maintenant publié !
                    </span>
                </div>
            )}
            {showFeaturedSuccess && (
                <div className="mb-5 flex items-center gap-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-sm">
                    <Star className="w-5 h-5 text-yellow-600 shrink-0 fill-yellow-600" />
                    <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                        Paiement confirmé — votre évènement est maintenant en vedette !
                    </span>
                </div>
            )}
            {showFeaturedError && (
                <div className="mb-5 flex items-center gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <span className="text-red-800 dark:text-red-200 font-medium">
                        Le paiement a échoué. Vous pouvez réessayer ci-dessous.
                    </span>
                </div>
            )}
            {event.isCancelled ? (
                <div className="mb-5 flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-red-800 dark:text-red-200">
                            Évènement annulé
                        </p>
                        <p className="text-red-700 dark:text-red-300 mt-0.5">
                            {event.cancellationReason ||
                                "Cet évènement a été annulé et n'est plus visible par le public."}{" "}
                            Traitez les remboursements ci-dessous.
                        </p>
                    </div>
                </div>
            ) : (
                !event.isPublished && (
                    <div className="mb-5 flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-amber-800 dark:text-amber-200">
                                Évènement non publié — en attente de paiement
                            </p>
                            <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                                Cet évènement n&apos;est pas visible par le public. Finalisez le paiement de{" "}
                                {settings.eventCreationFee.toLocaleString("fr-FR")} FCFA pour le publier.
                            </p>
                        </div>
                    </div>
                )
            )}
            {event.isCancelled && ordersToRefund.length > 0 && (
                <div className="mb-6">
                    <RefundPanel
                        orders={ordersToRefund.map((o) => ({
                            id: o.id,
                            reference: o.reference,
                            totalAmount: o.totalAmount,
                            status: o.status as "COMPLETED" | "REFUNDED",
                            buyerName: o.user?.name ?? o.guestName ?? "Client",
                            buyerEmail: o.user?.email ?? o.guestEmail ?? "",
                        }))}
                    />
                </div>
            )}

            {/* ── En-tête ──────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6">
                <Link href="/dashboard/events">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="w-4 h-4" />{" "}
                        <span className="hidden md:block">Retour</span>
                    </Button>
                </Link>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                    {canFeature && (
                        <FeaturedButton eventId={event.id} fee={settings.featuredEventFee} />
                    )}
                    <CampaignDialog
                        eventId={event.id}
                        eventTitle={event.title}
                        remaining={campaignsRemaining}
                        nextAvailableAt={
                            campaignNextAvailableAt
                                ? campaignNextAvailableAt.toISOString()
                                : null
                        }
                    />
                    {!event.isCancelled && !event.isDeleted && (
                        <CancelEventButton
                            eventId={event.id}
                            eventTitle={event.title}
                        />
                    )}
                    <DeleteEventButton
                        eventId={event.id}
                        eventTitle={event.title}
                    />
                    <a href={`/api/events/${event.id}/attendees`} download>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Download className="w-4 h-4" />
                            Participants
                        </Button>
                    </a>
                    <Link href={`/dashboard/events/${event.id}/agents`}>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Users className="w-4 h-4" />
                            Agents
                        </Button>
                    </Link>
                    <Link href={`/dashboard/events/${event.id}/edit`}>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Pencil className="w-4 h-4" />
                            Modifier
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_400px] gap-8">
                {/* ── Colonne gauche : Aperçu ───────────────────────── */}
                <div className="space-y-6">
                    <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
                        {/* Image */}
                        <div className="relative h-75 bg-muted w-full">
                            {event.imageUrl ? (
                                <Image
                                    src={event.imageUrl}
                                    alt={event.title}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                                    Sans image d&apos;en-tête
                                </div>
                            )}

                            {/* Badge vedette */}
                            {event.isFeatured && (
                                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-yellow-400/90 text-yellow-900 text-xs font-bold px-3 py-1.5 rounded-full shadow">
                                    <Star className="w-3.5 h-3.5 fill-yellow-900" />
                                    Évènement vedette
                                </div>
                            )}

                            {/* Badge type */}
                            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm border text-xs font-medium px-3 py-1.5 rounded-full shadow">
                                {event.eventType === "ONLINE" ? (
                                    <>
                                        <MonitorPlay className="w-3.5 h-3.5 text-blue-500" />
                                        <span className="text-blue-500">
                                            En ligne
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="text-emerald-500">
                                            Présentiel
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="p-6 md:p-8">
                            <h1 className="text-3xl font-afo mb-4">
                                {event.title}
                            </h1>

                            {/* Dates + Lieu/URL */}
                            <div className="flex flex-wrap gap-3 text-sm mb-5">
                                <div className="flex items-center gap-2 bg-secondary/10 px-3 py-1.5 rounded-full text-secondary font-medium">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                        Du{" "}
                                        {new Date(
                                            event.startDate,
                                        ).toLocaleDateString("fr-FR")}{" "}
                                        au{" "}
                                        {new Date(
                                            event.endDate,
                                        ).toLocaleDateString("fr-FR")}
                                    </span>
                                </div>

                                {event.eventType === "IN_PERSON" &&
                                    event.location && (
                                        <div className="flex items-center gap-2 border px-3 py-1.5 rounded-full text-muted-foreground">
                                            <MapPin className="w-4 h-4" />
                                            <span>{event.location}</span>
                                        </div>
                                    )}

                                {event.eventType === "ONLINE" &&
                                    event.onlineUrl && (
                                        <a
                                            href={event.onlineUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 border px-3 py-1.5 rounded-full text-blue-500 hover:bg-blue-500/5 transition-colors"
                                        >
                                            <MonitorPlay className="w-4 h-4" />
                                            <span className="underline underline-offset-2">
                                                Lien de connexion
                                            </span>
                                        </a>
                                    )}
                            </div>

                            {/* Catégories */}
                            {event.categories.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {event.categories.map(({ category }) => (
                                        <span
                                            key={category.id}
                                            className="text-xs bg-secondary text-secondary-foreground font-medium px-3 py-1 rounded-full"
                                        >
                                            {category.name}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Description */}
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <h3 className="text-lg font-bold mb-2">
                                    Description
                                </h3>
                                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                                    {event.description}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Colonne droite : Billetterie ──────────────────── */}
                <div className="space-y-6">
                    <div className="bg-card border rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-afo flex items-center gap-2">
                                <TicketIcon className="w-5 h-5 text-primary" />
                                Billetterie
                            </h2>
                            <span className="text-xs text-muted-foreground">
                                {event.tickets.length} billet
                                {event.tickets.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        {/* Liste des billets */}
                        {event.tickets.length === 0 ? (
                            <div className="text-center py-8 bg-muted/30 rounded-2xl border border-dashed mb-6">
                                <p className="text-muted-foreground text-sm">
                                    Aucun billet configuré pour cet évènement.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 mb-8">
                                {event.tickets.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="border rounded-xl p-4 flex justify-between items-start gap-4 hover:border-secondary/50 transition-colors"
                                    >
                                        {/* Infos */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold truncate">
                                                {ticket.title}
                                            </h4>
                                            {ticket.description && (
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                    {ticket.description}
                                                </p>
                                            )}
                                            <div className="flex gap-3 mt-2 text-xs">
                                                <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                                    {ticket.price === 0
                                                        ? "Gratuit"
                                                        : `${ticket.price.toLocaleString("fr-FR")} FCFA`}
                                                </span>
                                                {ticket.totalStock != null && (
                                                    <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                                        Stock :{" "}
                                                        {ticket.totalStock}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <TicketEditDialog ticket={ticket} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Formulaire d'ajout */}
                        <div className="border-t pt-6">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Ajouter un nouveau billet
                            </h3>
                            <TicketForm eventId={event.id} />
                        </div>
                    </div>

                    <EventPartnersPanel eventId={event.id} initialPartners={eventPartners} />
                </div>
            </div>
        </div>
    );
}
