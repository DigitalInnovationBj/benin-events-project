"use client";

import { useState, useEffect } from "react";
import {
    Cookie,
    Settings,
    X,
    ChevronLeft,
    Shield,
    BarChart2,
    Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ─────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────

const STORAGE_KEY = "benin-events-cookie-consent";

type ConsentState = {
    given: true;
    analytics: boolean;
    marketing: boolean;
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function CookieBanner() {
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);
    const [customizing, setCustomizing] = useState(false);
    const [analytics, setAnalytics] = useState(false);
    const [marketing, setMarketing] = useState(false);

    // Check localStorage after hydration — show banner if no consent stored
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                setMounted(true);
                const t = setTimeout(() => setVisible(true), 800);
                return () => clearTimeout(t);
            }
        } catch {
            // localStorage unavailable (SSR guard or private browsing)
        }
    }, []);

    const save = (consent: ConsentState) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
        } catch {
            // ignore write errors
        }
        // Animate out then unmount
        setVisible(false);
        setTimeout(() => setMounted(false), 500);
    };

    const acceptAll = () =>
        save({ given: true, analytics: true, marketing: true });

    const rejectAll = () =>
        save({ given: true, analytics: false, marketing: false });

    const saveCustom = () =>
        save({ given: true, analytics, marketing });

    if (!mounted) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none">
            <div
                className={cn(
                    "max-w-2xl mx-auto rounded-2xl border bg-card shadow-2xl pointer-events-auto",
                    "transition-all duration-500 ease-out",
                    visible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-6",
                )}
            >
                {!customizing ? (
                    /* ── Bandeau principal ───────────────────────────────── */
                    <div className="p-5 md:p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                                    <Cookie className="w-4 h-4 text-secondary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm leading-tight">
                                        Nous utilisons des cookies
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Pour améliorer votre expérience sur
                                        Benin Events
                                    </p>
                                </div>
                            </div>

                            {/* Close = refuser les non-essentiels */}
                            <button
                                onClick={rejectAll}
                                aria-label="Fermer et refuser les cookies non essentiels"
                                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-muted-foreground leading-relaxed mb-5 pl-12">
                            Nous utilisons des cookies essentiels au bon
                            fonctionnement du site et, avec votre accord, des
                            cookies analytiques pour améliorer nos services.{" "}
                            <Link
                                href="/cookies"
                                className="text-secondary hover:underline"
                            >
                                En savoir plus
                            </Link>
                        </p>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                                onClick={() => setCustomizing(true)}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-xl hover:bg-muted"
                            >
                                <Settings className="w-3.5 h-3.5" />
                                Personnaliser
                            </button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl text-xs h-8"
                                onClick={rejectAll}
                            >
                                Refuser
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="rounded-xl text-xs h-8 gap-1.5"
                                onClick={acceptAll}
                            >
                                <Shield className="w-3 h-3" />
                                Tout accepter
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* ── Panneau personnalisation ────────────────────────── */
                    <div className="p-5 md:p-6">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-5">
                            <button
                                onClick={() => setCustomizing(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
                                aria-label="Retour"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <p className="font-semibold text-sm">
                                Personnaliser les cookies
                            </p>
                        </div>

                        {/* Categories */}
                        <div className="space-y-3 mb-6">
                            {/* Essentiels — toujours activés */}
                            <div className="flex items-start justify-between gap-4 rounded-xl bg-muted/50 px-4 py-3">
                                <div className="flex items-start gap-3">
                                    <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <div>
                                        <Label className="text-sm font-semibold cursor-default">
                                            Essentiels
                                        </Label>
                                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                            Authentification, sécurité et
                                            session. Indispensables au
                                            fonctionnement.
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked
                                    disabled
                                    className="shrink-0 mt-0.5"
                                    aria-label="Cookies essentiels (toujours activés)"
                                />
                            </div>

                            {/* Analytiques */}
                            <div className="flex items-start justify-between gap-4 rounded-xl border px-4 py-3 transition-colors hover:bg-muted/30">
                                <div className="flex items-start gap-3">
                                    <BarChart2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                                    <div>
                                        <Label
                                            htmlFor="analytics-switch"
                                            className="text-sm font-semibold cursor-pointer"
                                        >
                                            Analytiques
                                        </Label>
                                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                            Mesure d&apos;audience et
                                            amélioration de l&apos;expérience
                                            utilisateur.
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    id="analytics-switch"
                                    checked={analytics}
                                    onCheckedChange={setAnalytics}
                                    className="shrink-0 mt-0.5"
                                    aria-label="Cookies analytiques"
                                />
                            </div>

                            {/* Marketing */}
                            <div className="flex items-start justify-between gap-4 rounded-xl border px-4 py-3 transition-colors hover:bg-muted/30">
                                <div className="flex items-start gap-3">
                                    <Target className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                                    <div>
                                        <Label
                                            htmlFor="marketing-switch"
                                            className="text-sm font-semibold cursor-pointer"
                                        >
                                            Marketing
                                        </Label>
                                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                            Personnalisation des contenus et
                                            publicités.
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    id="marketing-switch"
                                    checked={marketing}
                                    onCheckedChange={setMarketing}
                                    className="shrink-0 mt-0.5"
                                    aria-label="Cookies marketing"
                                />
                            </div>
                        </div>

                        {/* Save */}
                        <Button
                            onClick={saveCustom}
                            variant="secondary"
                            size="sm"
                            className="w-full rounded-xl"
                        >
                            Enregistrer mes préférences
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
