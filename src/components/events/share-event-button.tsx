"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareEventButtonProps {
    title: string;
    className?: string;
}

export default function ShareEventButton({
    title,
    className,
}: ShareEventButtonProps) {
    const handleShare = async () => {
        const url = window.location.href;

        try {
            if (navigator.share) {
                await navigator.share({
                    title,
                    text: `Découvre cet évènement: ${title}`,
                    url,
                });
                return;
            }

            await navigator.clipboard.writeText(url);
            toast.success("Lien copié dans le presse-papiers");
        } catch {
            toast.error("Impossible de partager cet évènement");
        }
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="icon"
            className={className}
            onClick={handleShare}
            aria-label="Partager cet évènement"
            title="Partager cet évènement"
        >
            <Share2 className="w-4 h-4 cursor-pointer" />
        </Button>
    );
}
