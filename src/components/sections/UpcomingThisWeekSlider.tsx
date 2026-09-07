"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";

import {
    IconClock,
    IconChevronLeft,
    IconChevronRight,
} from "@tabler/icons-react";
import EventCard, { type EventForCard } from "@/components/events/event-card";

function getDaysLabel(date: Date | string): string {
    const now = new Date();
    const start = new Date(date);
    const diffDays = Math.floor(
        (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Demain";
    return `Dans ${diffDays} j.`;
}

export default function UpcomingThisWeekSlider({
    events,
}: {
    events: EventForCard[];
}) {
    const [swiper, setSwiper] = useState<SwiperType | null>(null);
    const [isBeginning, setIsBeginning] = useState(true);
    const [isEnd, setIsEnd] = useState(false);

    return (
        <section className="py-14 border-t bg-muted/40">
            <div className="max-w-6xl mx-auto px-6 md:px-12">
                {/* Header */}
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <IconClock className="w-4 h-4 text-secondary" />
                            <span className="text-secondary text-xs font-bold uppercase tracking-widest">
                                Cette semaine
                            </span>
                        </div>
                        <h2 className="font-afo text-4xl md:text-5xl">
                            À ne pas manquer
                        </h2>
                    </div>

                    {/* Nav buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => swiper?.slidePrev()}
                            disabled={isBeginning}
                            className="w-10 h-10 rounded-full border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-secondary/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Précédent"
                        >
                            <IconChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => swiper?.slideNext()}
                            disabled={isEnd}
                            className="w-10 h-10 rounded-full border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-secondary/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Suivant"
                        >
                            <IconChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Swiper */}
                <Swiper
                    modules={[Navigation]}
                    breakpoints={{
                        0: { slidesPerView: 1.15, spaceBetween: 12 },
                        640: { slidesPerView: 2.2, spaceBetween: 16 },
                        1024: { slidesPerView: 3, spaceBetween: 24 },
                    }}
                    onSwiper={(s) => {
                        setSwiper(s);
                        setIsBeginning(s.isBeginning);
                        setIsEnd(s.isEnd);
                    }}
                    onSlideChange={(s) => {
                        setIsBeginning(s.isBeginning);
                        setIsEnd(s.isEnd);
                    }}
                >
                    {events.map((event) => (
                        <SwiperSlide key={event.id}>
                            {/* Wrapper relatif pour le badge flottant */}
                            <div className="relative">
                                <div className="absolute top-3 right-3 z-10 pointer-events-none">
                                    <span className="flex items-center gap-1 bg-secondary text-secondary-foreground text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                                        <IconClock className="w-3 h-3" />
                                        {getDaysLabel(event.startDate)}
                                    </span>
                                </div>
                                <EventCard event={event} view="grid" />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </section>
    );
}
