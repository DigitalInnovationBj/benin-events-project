import { Suspense } from "react";
import Hero from "@/components/sections/Hero";
import FeaturedEvents from "@/components/sections/FeaturedEvents";
import CategoriesSection from "@/components/sections/CategoriesSection";
import UpcomingThisWeek from "@/components/sections/UpcomingThisWeek";
import TrendingSection from "@/components/sections/TrendingSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import CitiesSection from "@/components/sections/CitiesSection";
import OrganizerCTASection from "@/components/sections/OrganizerCTASection";
import {
    SectionSkeleton,
    CardGridSkeleton,
    SliderSkeleton,
} from "@/components/sections/section-skeletons";

// La navbar lit désormais la session côté client (cf. Header.tsx), donc plus
// aucune API dynamique dans l'arbre : l'accueil est réellement cacheable.
// 5 min suffisent à absorber les pics sans retarder la publication d'un
// évènement.
export const revalidate = 300;

/**
 * Accueil.
 *
 * Chaque section fetche ses propres données. Sans limite de Suspense, le TTFB
 * serait la somme de toutes les requêtes Prisma ; ici le Hero (statique) part
 * immédiatement et les sections arrivent en flux, dans l'ordre.
 */
export default function Home() {
    return (
        <>
            <Hero />

            <Suspense fallback={<SliderSkeleton />}>
                <FeaturedEvents />
            </Suspense>

            <Suspense fallback={<SectionSkeleton />}>
                <CategoriesSection />
            </Suspense>

            <Suspense fallback={<SliderSkeleton />}>
                <UpcomingThisWeek />
            </Suspense>

            <Suspense fallback={<CardGridSkeleton count={6} />}>
                <TrendingSection />
            </Suspense>

            {/* Statique : aucune donnée à attendre */}
            <HowItWorksSection />

            <Suspense fallback={<SectionSkeleton />}>
                <CitiesSection />
            </Suspense>

            <OrganizerCTASection />
        </>
    );
}
