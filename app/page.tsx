import { Footer } from "@/components/sections/Footer";
import { Header } from "@/components/sections/Header";
import { HeroSection } from "@/components/sections/HeroSection";
import { LatestEvents } from "@/components/sections/LatestEvents";
import { OrganizersCTA } from "@/components/sections/OrganizersCTA";

export default function Home() {
    return (
        <>
            <Header />
            <HeroSection />
            <LatestEvents />
            <OrganizersCTA />
            <Footer />
        </>
    );
}
