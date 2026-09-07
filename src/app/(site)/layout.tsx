import Header from "@/components/sections/Header";
import Footer from "@/components/sections/Footer";

/**
 * Coquille du site public : navigation, contenu, pied de page.
 *
 * Avant, chaque page importait Header/Footer à la main — ce qui avait laissé
 * `/events/[slug]` et `/checkout/*` sans navigation alors que ce sont les
 * pages d'atterrissage les plus partagées. Les regrouper ici garantit la
 * cohérence et évite de re-rendre la navbar à chaque navigation interne.
 *
 * Le groupe `(site)` n'apparaît pas dans les URLs.
 */
export default function SiteLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <a
                href="#contenu"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-lg focus:bg-secondary focus:px-4 focus:py-2 focus:font-semibold focus:text-secondary-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
            >
                Aller au contenu
            </a>

            <Header />

            <main id="contenu" className="flex-1">
                {children}
            </main>

            <Footer />
        </div>
    );
}
