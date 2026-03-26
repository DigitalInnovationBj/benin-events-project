"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareEventButtonProps {
    title: string;
    startDate: string;
    location: string;
    className?: string;
}

export default function ShareEventButton({
    title,
    startDate,
    location,
    className,
}: ShareEventButtonProps) {
    const handleShare = async () => {
        const url = window.location.href;
        const eventDate = new Date(startDate);
        const dateLabel = eventDate.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "Africa/Porto-Novo",
        });
        const timeLabel = eventDate.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Africa/Porto-Novo",
        });
        const shareText = `🎉 Participe avec moi à cet évènement !\n📅 ${dateLabel}\n🕒 ${timeLabel}\n📍 ${location}`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title,
                    text: shareText,
                    url,
                });
                return;
            }

            await navigator.clipboard.writeText(`${shareText}\n🔗 ${url}`);
            toast.success("Texte de partage copié");
        } catch {
            toast.error("Impossible de partager cet évènement");
        }
    };

    return (
        <Button
            type="button"
            className={className}
            onClick={handleShare}
            aria-label="Partager cet évènement"
            title="Partager cet évènement"
        >
            <Share2 className="w-4 h-4" />
            Partager
        </Button>
    );
}
