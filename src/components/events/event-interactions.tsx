"use client";

import { useState } from "react";
import { Heart, Bookmark, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    toggleLike,
    toggleFavorite,
    incrementShareCount,
} from "@/actions/event.actions";

interface EventInteractionsProps {
    eventId: string;
    initialLikeCount: number;
    initialFavoriteCount: number;
    initialShareCount: number;
    initialIsLiked: boolean;
    initialIsFavorited: boolean;
    isLoggedIn: boolean;
    // Données pour le partage
    title: string;
    startDate: string;
    eventType: "IN_PERSON" | "ONLINE";
    location: string | null;
    onlineUrl: string | null;
}

export default function EventInteractions({
    eventId,
    initialLikeCount,
    initialFavoriteCount,
    initialIsLiked,
    initialIsFavorited,
    isLoggedIn,
    title,
    startDate,
    eventType,
    location,
    onlineUrl,
}: EventInteractionsProps) {
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [favoriteCount, setFavoriteCount] = useState(initialFavoriteCount);
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

    // ── Like ────────────────────────────────────────────────────────────────

    const handleLike = async () => {
        if (!isLoggedIn) {
            toast.error("Connectez-vous pour liker cet évènement.");
            return;
        }

        // Optimistic update
        const newLiked = !isLiked;
        setIsLiked(newLiked);
        setLikeCount((c) => (newLiked ? c + 1 : Math.max(0, c - 1)));
        setIsLikeLoading(true);

        try {
            const res = await toggleLike(eventId);
            if (res.error) {
                // Revert
                setIsLiked(!newLiked);
                setLikeCount((c) => (newLiked ? Math.max(0, c - 1) : c + 1));
                toast.error(res.error);
            }
        } catch {
            setIsLiked(!newLiked);
            setLikeCount((c) => (newLiked ? Math.max(0, c - 1) : c + 1));
            toast.error("Erreur inattendue.");
        } finally {
            setIsLikeLoading(false);
        }
    };

    // ── Favori ──────────────────────────────────────────────────────────────

    const handleFavorite = async () => {
        if (!isLoggedIn) {
            toast.error("Connectez-vous pour mettre cet évènement en favoris.");
            return;
        }

        // Optimistic update
        const newFavorited = !isFavorited;
        setIsFavorited(newFavorited);
        setFavoriteCount((c) => (newFavorited ? c + 1 : Math.max(0, c - 1)));
        setIsFavoriteLoading(true);

        try {
            const res = await toggleFavorite(eventId);
            if (res.error) {
                // Revert
                setIsFavorited(!newFavorited);
                setFavoriteCount((c) =>
                    newFavorited ? Math.max(0, c - 1) : c + 1,
                );
                toast.error(res.error);
            }
        } catch {
            setIsFavorited(!newFavorited);
            setFavoriteCount((c) =>
                newFavorited ? Math.max(0, c - 1) : c + 1,
            );
            toast.error("Erreur inattendue.");
        } finally {
            setIsFavoriteLoading(false);
        }
    };

    // ── Partage ─────────────────────────────────────────────────────────────

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

        const locationText =
            eventType === "ONLINE"
                ? onlineUrl ?? "En ligne"
                : location ?? "Lieu à confirmer";

        const locationIcon = eventType === "ONLINE" ? "🌐" : "📍";

        const shareText = [
            `🎉 ${title}`,
            `📅 ${dateLabel} à ${timeLabel}`,
            `${locationIcon} ${locationText}`,
            `🎟 Infos & billetterie :`,
        ].join("\n");

        try {
            if (navigator.share) {
                await navigator.share({ title, text: shareText, url });
            } else {
                await navigator.clipboard.writeText(
                    `${shareText}\n🔗 ${url}`,
                );
                toast.success("Texte de partage copié !");
            }
            // Incrémenter le compteur côté serveur (best-effort)
            await incrementShareCount(eventId);
        } catch (err) {
            // Ignorer l'annulation volontaire de l'utilisateur
            if ((err as Error)?.name !== "AbortError") {
                toast.error("Impossible de partager cet évènement.");
            }
        }
    };

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {/* Like */}
            <button
                type="button"
                onClick={handleLike}
                disabled={isLikeLoading}
                aria-label={isLiked ? "Retirer le like" : "Liker cet évènement"}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-sm select-none",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    isLiked
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600"
                        : "bg-background/80 border border-border text-foreground hover:bg-background hover:border-red-400 hover:text-red-500",
                )}
            >
                <Heart
                    className={cn(
                        "w-4 h-4 transition-all",
                        isLiked && "fill-white scale-110",
                    )}
                />
                <span>
                    {likeCount > 0 ? likeCount.toLocaleString("fr-FR") : "J'aime"}
                </span>
            </button>

            {/* Favori */}
            <button
                type="button"
                onClick={handleFavorite}
                disabled={isFavoriteLoading}
                aria-label={
                    isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"
                }
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-sm select-none",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    isFavorited
                        ? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20 hover:opacity-90"
                        : "bg-background/80 border border-border text-foreground hover:bg-background hover:border-secondary hover:text-secondary",
                )}
            >
                <Bookmark
                    className={cn(
                        "w-4 h-4 transition-all",
                        isFavorited && "fill-secondary-foreground scale-110",
                    )}
                />
                <span>
                    {favoriteCount > 0
                        ? favoriteCount.toLocaleString("fr-FR")
                        : "Favoris"}
                </span>
            </button>

            {/* Partager */}
            <button
                type="button"
                onClick={handleShare}
                aria-label="Partager cet évènement"
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-sm select-none bg-background/80 border border-border text-foreground hover:bg-background hover:border-foreground/40"
            >
                <Share2 className="w-4 h-4" />
                <span>Partager</span>
            </button>
        </div>
    );
}
