import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";

const spaceGrotesk = Space_Grotesk({
    variable: "--font-space-grotesk",
    subsets: ["latin"],
});

const afolkalips = localFont({
    src: "./fonts/Afolkalips.otf",
    variable: "--font-afo",
});

export const metadata: Metadata = {
    title: "Benin Events",
    description: "Trouvez les meilleurs événements au Bénin",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider>
            <html lang="fr" suppressHydrationWarning>
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
                    </ThemeProvider>
                </body>
            </html>
        </ClerkProvider>
    );
}
