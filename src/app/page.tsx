import Header from "@/components/sections/Header";
import Hero from "@/components/sections/Hero";
import FeaturedEvents from "@/components/sections/FeaturedEvents";
import CategoriesSection from "@/components/sections/CategoriesSection";
import UpcomingThisWeek from "@/components/sections/UpcomingThisWeek";
import TrendingSection from "@/components/sections/TrendingSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import CitiesSection from "@/components/sections/CitiesSection";
import OrganizerCTASection from "@/components/sections/OrganizerCTASection";
import Footer from "@/components/sections/Footer";

export default function Home() {
    return (
        <main className="min-h-screen bg-background">
            <Header />
            <Hero />
            <FeaturedEvents />
            <CategoriesSection />
            <UpcomingThisWeek />
            <TrendingSection />
            <HowItWorksSection />
            <CitiesSection />
            <OrganizerCTASection />
            <Footer />
        </main>
    );
}
