import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import CookieBanner from "@/components/CookieBanner";

const spaceGrotesk = Space_Grotesk({
    variable: "--font-space-grotesk",
    subsets: ["latin"],
});

const afolkalips = localFont({
    src: "./fonts/Afolkalips.otf",
    variable: "--font-afo",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const TITLE = "Benin Events";
const DESCRIPTION =
    "La plateforme de référence pour découvrir, réserver et organiser les meilleurs évènements au Bénin. Concerts, festivals, conférences, galas et bien plus.";
const OG_IMAGE = "/og-img.jpg";

export const metadata: Metadata = {
    metadataBase: new URL(APP_URL),

    // ── Titre ──────────────────────────────────────────────────────────
    title: {
        default: TITLE,
        template: `%s | ${TITLE}`,
    },

    // ── Description & mots-clés ────────────────────────────────────────
    description: DESCRIPTION,
    keywords: [
        "évènements Bénin",
        "concerts Cotonou",
        "festivals Bénin",
        "billetterie Bénin",
        "organiser évènement Bénin",
        "sorties Cotonou",
        "Porto-Novo évènements",
        "Parakou évènements",
        "Ouidah festivals",
        "Benin Events",
    ],

    // ── Auteur / éditeur ───────────────────────────────────────────────
    authors: [{ name: "Benin Events", url: APP_URL }],
    creator: "Benin Events",
    publisher: "Benin Events",
    applicationName: "Benin Events",
    category: "entertainment",

    // ── Robots ─────────────────────────────────────────────────────────
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },

    // ── Open Graph ─────────────────────────────────────────────────────
    openGraph: {
        type: "website",
        locale: "fr_FR",
        url: APP_URL,
        siteName: TITLE,
        title: `${TITLE} — Les meilleurs évènements du Bénin`,
        description: DESCRIPTION,
        images: [
            {
                url: OG_IMAGE,
                width: 1200,
                height: 630,
                alt: "Benin Events — Les meilleurs évènements du Bénin",
                type: "image/jpeg",
            },
        ],
    },

    // ── Twitter / X ────────────────────────────────────────────────────
    twitter: {
        card: "summary_large_image",
        title: `${TITLE} — Les meilleurs évènements du Bénin`,
        description: DESCRIPTION,
        images: [OG_IMAGE],
        creator: "@beninevents",
        site: "@beninevents",
    },

    // ── Canonical ──────────────────────────────────────────────────────
    alternates: {
        canonical: APP_URL,
        languages: {
            "fr-BJ": APP_URL,
        },
    },

    // ── Vérification de propriété (Google Search Console, etc.) ─────────
    verification: {
        google: process.env.GOOGLE_SITE_VERIFICATION,
    },
};

// ── Viewport (thème couleur, viewport mobile) ──────────────────────────
export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#ffffff" },
        { media: "(prefers-color-scheme: dark)", color: "#251333" },
    ],
    width: "device-width",
    initialScale: 1,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" suppressHydrationWarning className="scroll-smooth">
            <body
                className={`${spaceGrotesk.variable} ${afolkalips.variable} font-sans antialiased`}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem={false}
                    disableTransitionOnChange
                >
                    {children}
                    <Toaster position="top-center" />
                    <CookieBanner />
                </ThemeProvider>
            </body>
        </html>
    );
}
