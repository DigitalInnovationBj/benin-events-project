"use client";

import { useState } from "react";
import {
    IconBrandWhatsapp,
    IconBrandFacebook,
    IconBrandX,
    IconLink,
    IconCheck,
    IconDeviceMobile,
} from "@tabler/icons-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { incrementShareCount } from "@/actions/event.actions";

interface ShareEventDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    eventId: string;
    title: string;
    startDate: string;
    eventType: "IN_PERSON" | "ONLINE";
    location: string | null;
}

function buildShareText({
    title,
    startDate,
    eventType,
    location,
}: Pick<
    ShareEventDialogProps,
    "title" | "startDate" | "eventType" | "location"
>) {
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

    const locationIcon = eventType === "ONLINE" ? "🌐" : "📍";
    const locationText =
        eventType === "ONLINE" ? "Évènement en ligne" : location ?? "Lieu à confirmer";

    return [
        `🔥 ${title}`,
        `On y sera le ${dateLabel} à ${timeLabel} !`,
        `${locationIcon} ${locationText}`,
        `🎟️ Prends ton ticket avant qu'il n'y en ait plus 👇`,
    ].join("\n");
}

export default function ShareEventDialog({
    open,
    onOpenChange,
    eventId,
    title,
    startDate,
    eventType,
    location,
}: ShareEventDialogProps) {
    const [copied, setCopied] = useState(false);

    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareText = buildShareText({
        title,
        startDate,
        eventType,
        location,
    });
    const fullText = `${shareText}\n${url}`;

    const track = () => {
        incrementShareCount(eventId).catch(() => {});
    };

    const openWindow = (href: string) => {
        window.open(href, "_blank", "noopener,noreferrer,width=600,height=640");
        track();
        onOpenChange(false);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(fullText);
            setCopied(true);
            toast.success("Texte de partage copié !");
            track();
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Impossible de copier le texte.");
        }
    };

    const handleNativeShare = async () => {
        try {
            await navigator.share({ title, text: shareText, url });
            track();
            onOpenChange(false);
        } catch (err) {
            if ((err as Error)?.name !== "AbortError") {
                toast.error("Impossible de partager cet évènement.");
            }
        }
    };

    const platforms = [
        {
            label: "WhatsApp",
            icon: IconBrandWhatsapp,
            className: "bg-[#25D366] hover:bg-[#1ebe57] text-white",
            onClick: () =>
                openWindow(
                    `https://wa.me/?text=${encodeURIComponent(fullText)}`,
                ),
        },
        {
            label: "Facebook",
            icon: IconBrandFacebook,
            className: "bg-[#1877F2] hover:bg-[#1567d8] text-white",
            onClick: () =>
                openWindow(
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText)}`,
                ),
        },
        {
            label: "X",
            icon: IconBrandX,
            className: "bg-black hover:bg-black/80 text-white",
            onClick: () =>
                openWindow(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`,
                ),
        },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Partager cet évènement</DialogTitle>
                    <DialogDescription>
                        Fais kiffer tes amis, partage l&apos;event 🎉
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm whitespace-pre-line text-foreground/90">
                    {shareText}
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {platforms.map(({ label, icon: Icon, className, onClick }) => (
                        <button
                            key={label}
                            type="button"
                            onClick={onClick}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <span
                                className={cn(
                                    "flex items-center justify-center w-12 h-12 rounded-full transition-transform group-hover:scale-105 group-active:scale-95",
                                    className,
                                )}
                            >
                                <Icon className="w-6 h-6" stroke={1.75} />
                            </span>
                            <span className="text-xs font-medium text-muted-foreground">
                                {label}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-2 pt-1">
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
                    >
                        {copied ? (
                            <IconCheck className="w-4 h-4 text-green-600" />
                        ) : (
                            <IconLink className="w-4 h-4" />
                        )}
                        {copied ? "Copié !" : "Copier le texte et le lien"}
                    </button>

                    {typeof navigator !== "undefined" && "share" in navigator && (
                        <button
                            type="button"
                            onClick={handleNativeShare}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
                        >
                            <IconDeviceMobile className="w-4 h-4" />
                            Plus d&apos;options...
                        </button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
