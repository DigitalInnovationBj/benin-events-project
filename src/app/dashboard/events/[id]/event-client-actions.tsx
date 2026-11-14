"use client";

import { useState } from "react";
import {
    IconBan,
    IconShare,
    IconSpeakerphone,
    IconStar,
    IconTrash,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setTicketOnSale } from "@/actions/ticket.actions";
import ShareEventDialog from "@/components/events/share-event-dialog";
import CancelEventButton from "./CancelEventButton";
import DeleteEventButton from "./DeleteEventButton";
import { FeaturedButton } from "./FeaturedButton";
import { CampaignDialog, isCampaignOnCooldown } from "./CampaignDialog";

/**
 * Actions client de la page évènement, segmentées par onglet : partage
 * (en-tête), promotion (onglet Promotion), actions sensibles (onglet
 * Paramètres). Elles remplacent l'ancien menu « … » qui mélangeait tout.
 */

export function ShareEventButton(props: {
    eventId: string;
    title: string;
    startDate: string;
    eventType: "IN_PERSON" | "ONLINE";
    location: string | null;
}) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                <IconShare className="size-4" aria-hidden="true" />
                Partager
            </Button>
            <ShareEventDialog {...props} open={open} onOpenChange={setOpen} />
        </>
    );
}

export function PromotionActions({
    eventId,
    eventTitle,
    canFeature,
    featuredFee,
    isFeatured,
    campaignRemaining,
    campaignNextAvailableAt,
}: {
    eventId: string;
    eventTitle: string;
    canFeature: boolean;
    featuredFee: number;
    isFeatured: boolean;
    campaignRemaining: number;
    campaignNextAvailableAt: string | null;
}) {
    const [dialog, setDialog] = useState<"campaign" | "featured" | null>(null);
    const onCooldown = isCampaignOnCooldown(campaignRemaining, campaignNextAvailableAt);

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-secondary">
                    <IconSpeakerphone className="size-5" aria-hidden="true" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold">Campagne email</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Annoncez l&apos;évènement à une liste d&apos;adresses.{" "}
                        {campaignRemaining > 0
                            ? `${campaignRemaining} envoi${campaignRemaining > 1 ? "s" : ""} restant${campaignRemaining > 1 ? "s" : ""}.`
                            : "Plus d'envoi disponible."}
                    </p>
                </div>
                <Button
                    variant="outline"
                    disabled={onCooldown}
                    onClick={() => setDialog("campaign")}
                >
                    Préparer une campagne
                </Button>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-secondary">
                    <IconStar className="size-5" aria-hidden="true" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold">Mise en vedette</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {isFeatured
                            ? "Votre évènement est en vedette sur la page d'accueil."
                            : canFeature
                              ? `Placez l'évènement en tête de la page d'accueil pour ${featuredFee.toLocaleString("fr-FR")} FCFA.`
                              : "La mise en vedette n'est pas disponible pour le moment."}
                    </p>
                </div>
                {canFeature && (
                    <Button variant="secondary" onClick={() => setDialog("featured")}>
                        Mettre en vedette
                    </Button>
                )}
            </div>

            <CampaignDialog
                eventId={eventId}
                eventTitle={eventTitle}
                remaining={campaignRemaining}
                nextAvailableAt={campaignNextAvailableAt}
                open={dialog === "campaign"}
                onOpenChange={(open) => setDialog(open ? "campaign" : null)}
            />
            {canFeature && (
                <FeaturedButton
                    eventId={eventId}
                    fee={featuredFee}
                    open={dialog === "featured"}
                    onOpenChange={(open) => setDialog(open ? "featured" : null)}
                />
            )}
        </div>
    );
}

export function DangerZone({
    eventId,
    eventTitle,
    canCancel,
}: {
    eventId: string;
    eventTitle: string;
    canCancel: boolean;
}) {
    const [dialog, setDialog] = useState<"cancel" | "delete" | null>(null);

    return (
        <section className="rounded-2xl border border-destructive/40 bg-card p-5">
            <h2 className="font-semibold text-destructive">Actions sensibles</h2>
            <p className="mt-1 text-sm text-muted-foreground">
                Annuler dépublie l&apos;évènement et ouvre le suivi des
                remboursements. Supprimer le retire définitivement de votre
                tableau de bord.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
                {canCancel && (
                    <Button variant="outline" onClick={() => setDialog("cancel")}>
                        <IconBan className="size-4" aria-hidden="true" />
                        Annuler l&apos;évènement
                    </Button>
                )}
                <Button variant="destructive" onClick={() => setDialog("delete")}>
                    <IconTrash className="size-4" aria-hidden="true" />
                    Supprimer
                </Button>
            </div>
            {canCancel && (
                <CancelEventButton
                    eventId={eventId}
                    eventTitle={eventTitle}
                    open={dialog === "cancel"}
                    onOpenChange={(open) => setDialog(open ? "cancel" : null)}
                />
            )}
            <DeleteEventButton
                eventId={eventId}
                eventTitle={eventTitle}
                open={dialog === "delete"}
                onOpenChange={(open) => setDialog(open ? "delete" : null)}
            />
        </section>
    );
}

/** Remet en vente un billet retiré (après une tentative de suppression). */
export function TicketOnSaleButton({ ticketId }: { ticketId: string }) {
    const router = useRouter();
    const [pending, setPending] = useState(false);
    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={async () => {
                setPending(true);
                const res = await setTicketOnSale(ticketId, true);
                setPending(false);
                if (res.error) {
                    toast.error(res.error);
                    return;
                }
                toast.success("Billet remis en vente");
                router.refresh();
            }}
        >
            Remettre en vente
        </Button>
    );
}
