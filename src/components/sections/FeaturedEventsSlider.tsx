"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

import Link from "next/link";
import Image from "next/image";
import {
    Calendar,
    MapPin,
    MonitorPlay,
    Star,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EventForCard } from "@/app/events/event-card";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "Africa/Porto-Novo",
    });
}

function getPriceLabel(tickets: { price: number }[]): string {
    if (!tickets.length) return "Libre d'accès";
    const price = tickets[0].price;
    if (price === 0) return "Gratuit";
    return `Dès ${price.toLocaleString("fr-FR")} FCFA`;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

interface Props {
    events: EventForCard[];
}

export default function FeaturedEventsSlider({ events }: Props) {
    const [swiper, setSwiper] = useState<SwiperType | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const hasMultiple = events.length > 1;

    return (
        <section className="relative overflow-hidden bg-black">
            {/* ── Label + slide counter ────────────────────────────────── */}
            <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
                <div className="max-w-6xl mx-auto px-6 md:px-12 pt-6 flex items-center justify-between">
                    {/* Badge "En vedette" */}
                    <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-secondary text-secondary" />
                        <span className="text-secondary text-xs font-bold uppercase tracking-widest">
                            Évènements en vedette
                        </span>
                    </div>

                    {/* Counter 01 / 04 */}
                    {hasMultiple && (
                        <span className="text-white/40 text-sm tabular-nums select-none">
                            <span className="text-white/75 font-medium">
                                {String(activeIndex + 1).padStart(2, "0")}
                            </span>
                            <span className="mx-1">/</span>
                            {String(events.length).padStart(2, "0")}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Swiper ───────────────────────────────────────────────── */}
            <div className="relative h-[min(88vh,720px)]">
                <Swiper
                    modules={[Autoplay, EffectFade, Pagination]}
                    effect="fade"
                    fadeEffect={{ crossFade: true }}
                    autoplay={
                        hasMultiple
                            ? { delay: 6000, disableOnInteraction: false }
                            : false
                    }
                    pagination={{ clickable: true }}
                    loop={hasMultiple}
                    speed={900}
                    className="featured-swiper h-full w-full"
                    onSwiper={setSwiper}
                    onSlideChange={(s) => setActiveIndex(s.realIndex)}
                >
                    {events.map((event) => {
                        const isOnline = event.eventType === "ONLINE";
                        const priceLabel = getPriceLabel(event.tickets);
                        const dateLabel = formatDate(event.startDate);

                        return (
                            <SwiperSlide key={event.id} className="h-full">
                                <div className="relative h-full w-full">
                                    {/* ── Background image ──────────── */}
                                    {event.imageUrl ? (
                                        <Image
                                            src={event.imageUrl}
                                            alt={event.title}
                                            fill
                                            priority
                                            className="object-cover"
                                            sizes="100vw"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-linear-to-br from-primary via-primary/70 to-primary/30" />
                                    )}

                                    {/* ── Gradient overlays ─────────── */}
                                    <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/50 to-black/10" />
                                    <div className="absolute inset-0 bg-linear-to-r from-black/65 via-black/15 to-transparent" />

                                    {/* ── Slide content ─────────────── */}
                                    <div className="absolute inset-0 flex items-end">
                                        <div className="max-w-6xl mx-auto w-full px-6 md:px-12 pb-20 md:pb-24">
                                            {/* Badges */}
                                            <div className="flex flex-wrap items-center gap-2 mb-5">
                                                <span
                                                    className={cn(
                                                        "text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm shadow",
                                                        isOnline
                                                            ? "bg-blue-500/80 text-white"
                                                            : "bg-emerald-500/80 text-white",
                                                    )}
                                                >
                                                    {isOnline
                                                        ? "En ligne"
                                                        : "Présentiel"}
                                                </span>

                                                {event.categories
                                                    .slice(0, 2)
                                                    .map(({ category }) => (
                                                        <span
                                                            key={category.slug}
                                                            className="text-xs bg-white/15 text-white font-medium px-3 py-1.5 rounded-full backdrop-blur-sm"
                                                        >
                                                            {category.name}
                                                        </span>
                                                    ))}
                                            </div>

                                            {/* Title */}
                                            <h2 className="font-afo text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.95] text-white mb-5 max-w-3xl">
                                                {event.title}
                                            </h2>

                                            {/* Date + Location */}
                                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/65 mb-8">
                                                <span className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-secondary shrink-0" />
                                                    <span className="capitalize">
                                                        {dateLabel}
                                                    </span>
                                                </span>

                                                {isOnline ? (
                                                    <span className="flex items-center gap-2">
                                                        <MonitorPlay className="w-4 h-4 text-blue-400 shrink-0" />
                                                        Évènement en ligne
                                                    </span>
                                                ) : event.location ? (
                                                    <span className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-secondary shrink-0" />
                                                        {event.location}
                                                    </span>
                                                ) : null}
                                            </div>

                                            {/* Price + CTA */}
                                            <div className="flex items-center gap-4 flex-wrap">
                                                <span className="font-bold text-2xl md:text-3xl text-secondary">
                                                    {priceLabel}
                                                </span>
                                                <Button
                                                    asChild
                                                    size="lg"
                                                    className="rounded-2xl gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg"
                                                >
                                                    <Link
                                                        href={`/events/${event.slug}`}
                                                    >
                                                        Voir l&apos;évènement
                                                        <ArrowRight className="w-4 h-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>

                {/* ── Custom navigation buttons ────────────────────────── */}
                {hasMultiple && (
                    <div className="absolute bottom-5 right-6 md:right-12 z-20 flex items-center gap-2">
                        <button
                            onClick={() => swiper?.slidePrev()}
                            className="w-10 h-10 rounded-full border border-white/20 bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/15 hover:border-white/40 transition-all duration-200"
                            aria-label="Évènement précédent"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => swiper?.slideNext()}
                            className="w-10 h-10 rounded-full border border-white/20 bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/15 hover:border-white/40 transition-all duration-200"
                            aria-label="Évènement suivant"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
