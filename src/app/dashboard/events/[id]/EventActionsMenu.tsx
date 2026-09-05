"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    IconDots,
    IconDownload,
    IconPencil,
    IconUsers,
    IconSpeakerphone,
    IconStar,
    IconBan,
    IconTrash,
} from "@tabler/icons-react";
import CancelEventButton from "./CancelEventButton";
import DeleteEventButton from "./DeleteEventButton";
import { FeaturedButton } from "./FeaturedButton";
import { CampaignDialog, isCampaignOnCooldown } from "./CampaignDialog";

interface Props {
    eventId: string;
    eventTitle: string;
    canFeature: boolean;
    featuredFee: number;
    canCancel: boolean;
    campaignRemaining: number;
    campaignNextAvailableAt: string | null;
}

type ActiveDialog = "campaign" | "featured" | "cancel" | "delete" | null;

export function EventActionsMenu({
    eventId,
    eventTitle,
    canFeature,
    featuredFee,
    canCancel,
    campaignRemaining,
    campaignNextAvailableAt,
}: Props) {
    const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
    const campaignOnCooldown = isCampaignOnCooldown(campaignRemaining, campaignNextAvailableAt);

    return (
        <>
            <Link href={`/dashboard/events/${eventId}/edit`}>
                <Button variant="outline" size="sm" className="gap-2">
                    <IconPencil className="w-4 h-4" />
                    Modifier
                </Button>
            </Link>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0" aria-label="Plus d'actions">
                        <IconDots className="w-4 h-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                        <a href={`/api/events/${eventId}/attendees`} download>
                            <IconDownload className="mr-2 h-4 w-4" />
                            Participants
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/events/${eventId}/agents`}>
                            <IconUsers className="mr-2 h-4 w-4" />
                            Agents
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        disabled={campaignOnCooldown}
                        onSelect={(e) => {
                            e.preventDefault();
                            setActiveDialog("campaign");
                        }}
                    >
                        <IconSpeakerphone className="mr-2 h-4 w-4" />
                        Campagne email
                    </DropdownMenuItem>
                    {canFeature && (
                        <DropdownMenuItem
                            onSelect={(e) => {
                                e.preventDefault();
                                setActiveDialog("featured");
                            }}
                        >
                            <IconStar className="mr-2 h-4 w-4" />
                            Mettre en vedette
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    {canCancel && (
                        <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10"
                            onSelect={(e) => {
                                e.preventDefault();
                                setActiveDialog("cancel");
                            }}
                        >
                            <IconBan className="mr-2 h-4 w-4" />
                            Annuler l&apos;évènement
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                        className="text-destructive focus:bg-destructive/10"
                        onSelect={(e) => {
                            e.preventDefault();
                            setActiveDialog("delete");
                        }}
                    >
                        <IconTrash className="mr-2 h-4 w-4" />
                        Supprimer
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <CampaignDialog
                eventId={eventId}
                eventTitle={eventTitle}
                remaining={campaignRemaining}
                nextAvailableAt={campaignNextAvailableAt}
                open={activeDialog === "campaign"}
                onOpenChange={(open) => setActiveDialog(open ? "campaign" : null)}
            />
            {canFeature && (
                <FeaturedButton
                    eventId={eventId}
                    fee={featuredFee}
                    open={activeDialog === "featured"}
                    onOpenChange={(open) => setActiveDialog(open ? "featured" : null)}
                />
            )}
            {canCancel && (
                <CancelEventButton
                    eventId={eventId}
                    eventTitle={eventTitle}
                    open={activeDialog === "cancel"}
                    onOpenChange={(open) => setActiveDialog(open ? "cancel" : null)}
                />
            )}
            <DeleteEventButton
                eventId={eventId}
                eventTitle={eventTitle}
                open={activeDialog === "delete"}
                onOpenChange={(open) => setActiveDialog(open ? "delete" : null)}
            />
        </>
    );
}
