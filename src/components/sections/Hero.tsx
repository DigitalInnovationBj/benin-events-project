import Link from "next/link";
import { Button } from "@/components/ui/button";
import HeroSpotlight from "@/components/sections/HeroSpotlight";
import {
    IconArrowRight,
} from "@tabler/icons-react";

export default function Hero() {
    return (
        <section className="relative overflow-hidden bg-background">
            {/* ── Blobs décoratifs ─────────────────────────────────────── */}
            <div
                className="pointer-events-none absolute inset-0 overflow-hidden"
                aria-hidden
            >
                <div className="absolute -top-40 left-1/2 h-150 w-225 -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
                <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-secondary/15 blur-3xl" />
                <div className="absolute -right-20 top-20 h-96 w-96 rounded-full bg-secondary/6 blur-3xl" />
                <div
                    className="absolute inset-0 opacity-[0.025]"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                        backgroundSize: "64px 64px",
                    }}
                />
            </div>

            {/* ── Contenu ───────────────────────────────────────────────── */}
            {/* Le texte occupe la hauteur restante, la bande d'images se cale
                en bas : l'ensemble tient dans un écran. */}
            <div className="relative flex min-h-[calc(100vh-4rem)] flex-col">
                <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-12 md:px-12 md:py-16">
                    {/* Titre */}
                    <h1 className="font-afo mb-6 text-center text-[clamp(3.5rem,9vw,6.5rem)] leading-none text-foreground">
                        Tous les
                        <span className="text-secondary"> meilleurs </span>
                        évènements
                        <br />
                        <span className="text-muted-foreground/50">
                            du Bénin.
                        </span>
                    </h1>

                    {/* Sous-titre */}
                    <p className="mb-10 max-w-2xl text-center text-base leading-relaxed text-muted-foreground md:text-lg">
                        Concerts, festivals, soirées de gala, conférences…
                        Découvrez et participez aux meilleurs évènements qui
                        font vibrer le Bénin.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Button
                            asChild
                            size="lg"
                            variant="secondary"
                            className="rounded-2xl gap-2"
                        >
                            <Link href="/events">
                                Voir tous les évènements
                                <IconArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="rounded-2xl"
                        >
                            <Link href="/dashboard">Organiser un évènement</Link>
                        </Button>
                    </div>
                </div>

                {/* ── Bande d'images ────────────────────────────────────── */}
                {/* Pleine largeur : elle sort volontairement du max-w-6xl. */}
                <HeroSpotlight />
            </div>
        </section>
    );
}
