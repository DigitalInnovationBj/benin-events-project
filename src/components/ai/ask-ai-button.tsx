"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Loader2, Calendar, MapPin, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import Image from "next/image";

interface EventResult {
    slug: string;
    title: string;
    startDate: string;
    location: string | null;
    eventType: "IN_PERSON" | "ONLINE";
    imageUrl: string | null;
    minPrice: number;
    categories: string[];
}

interface SearchResult {
    events: EventResult[];
    message: string;
}

const SUGGESTIONS = [
    "Un concert ce weekend",
    "Une conférence tech gratuite",
    "Un spectacle culturel",
    "Un évènement en famille",
];

export function AskAIButton() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SearchResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (open) setTimeout(() => textareaRef.current?.focus(), 100);
    }, [open]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    async function handleSubmit() {
        if (!query.trim() || loading) return;
        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const res = await fetch("/api/ai/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query }),
            });
            if (!res.ok) throw new Error();
            setResult(await res.json());
        } catch {
            setError("Une erreur est survenue. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    }

    function reset() {
        setQuery("");
        setResult(null);
        setError(null);
    }

    return (
        <>
            {/* ── Floating button ─────────────────────────────────────── */}
            <button
                onClick={() => setOpen(true)}
                aria-label="Recherche IA"
                className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-3 rounded-full shadow-xl hover:shadow-secondary/30 hover:scale-105 transition-all duration-200 font-semibold text-sm select-none"
            >
                <Sparkles className="w-4 h-4" />
                Ask AI
            </button>

            {/* ── Backdrop ────────────────────────────────────────────── */}
            {open && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* ── Panel ───────────────────────────────────────────────── */}
            <div
                className={`fixed bottom-0 right-0 z-50 flex flex-col bg-background border-l border-t sm:border rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:w-[420px] transition-transform duration-300 ease-out ${
                    open
                        ? "translate-y-0 sm:translate-y-0 sm:bottom-6 sm:right-6"
                        : "translate-y-full sm:translate-y-full pointer-events-none"
                }`}
                style={{ maxHeight: "85vh" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-secondary" />
                        </div>
                        <div>
                            <p className="font-bold text-sm leading-tight">Trouvez votre évènement</p>
                            <p className="text-xs text-muted-foreground leading-tight">Propulsé par Claude AI</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">

                    {/* Query input */}
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Décrivez l&apos;évènement que vous cherchez…
                        </p>
                        <Textarea
                            ref={textareaRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            placeholder="Ex: un concert afro ce weekend, une conférence gratuite…"
                            className="resize-none text-sm"
                            rows={3}
                        />
                    </div>

                    {/* Suggestions */}
                    {!result && !loading && (
                        <div className="flex flex-wrap gap-2">
                            {SUGGESTIONS.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setQuery(s)}
                                    className="text-xs bg-muted hover:bg-muted/70 rounded-full px-3 py-1.5 transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="flex flex-col items-center py-10 gap-3">
                            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-secondary" />
                            </div>
                            <p className="text-sm text-muted-foreground">Analyse en cours…</p>
                        </div>
                    )}

                    {/* Error */}
                    {error && !loading && (
                        <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">
                            {error}
                        </p>
                    )}

                    {/* Results */}
                    {result && !loading && (
                        <div className="space-y-3">
                            {/* AI message */}
                            <div className="flex items-start gap-2.5">
                                <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <Sparkles className="w-3 h-3 text-secondary" />
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">{result.message}</p>
                            </div>

                            {result.events.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-sm text-muted-foreground">Aucun évènement trouvé.</p>
                                    <button
                                        onClick={reset}
                                        className="text-xs text-secondary underline-offset-2 hover:underline mt-2"
                                    >
                                        Essayer une autre recherche
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {result.events.map((event) => (
                                        <Link
                                            key={event.slug}
                                            href={`/events/${event.slug}`}
                                            onClick={() => setOpen(false)}
                                            className="group flex gap-3 rounded-xl border hover:border-secondary/50 hover:bg-muted/30 transition-all p-3 overflow-hidden"
                                        >
                                            {/* Thumbnail */}
                                            {event.imageUrl ? (
                                                <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden">
                                                    <Image
                                                        src={event.imageUrl}
                                                        alt={event.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                                                    <Sparkles className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                            )}

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-secondary transition-colors">
                                                    {event.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                    <Calendar className="w-3 h-3 shrink-0" />
                                                    {new Date(event.startDate).toLocaleDateString("fr-FR", {
                                                        weekday: "short",
                                                        day: "numeric",
                                                        month: "short",
                                                        timeZone: "Africa/Porto-Novo",
                                                    })}
                                                </p>
                                                {event.eventType === "IN_PERSON" && event.location && (
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                                        <MapPin className="w-3 h-3 shrink-0" />
                                                        <span className="truncate">{event.location}</span>
                                                    </p>
                                                )}
                                                <p className="text-xs font-bold text-secondary mt-1">
                                                    {event.minPrice === 0
                                                        ? "Gratuit"
                                                        : `Dès ${event.minPrice.toLocaleString("fr-FR")} FCFA`}
                                                </p>
                                            </div>

                                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 self-center group-hover:text-secondary transition-colors" />
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* New search */}
                            <button
                                onClick={reset}
                                className="text-xs text-secondary underline-offset-2 hover:underline w-full text-center pt-1"
                            >
                                Nouvelle recherche
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer / CTA */}
                {!result && (
                    <div className="border-t px-5 py-4 shrink-0">
                        <Button
                            onClick={handleSubmit}
                            disabled={!query.trim() || loading}
                            className="w-full gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            {loading ? "Recherche…" : "Rechercher"}
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}
