import localFont from "next/font/local";

// Polices fournies par l'organisateur (charte du festival).
export const adjatcheTitle = localFont({
    src: "../../app/fonts/Impact.ttf",
    variable: "--font-adj-title",
    display: "swap",
});

export const adjatcheBody = localFont({
    src: [
        { path: "../../app/fonts/Gotham-Book.otf", weight: "400" },
        { path: "../../app/fonts/Gotham-Bold.ttf", weight: "700" },
    ],
    variable: "--font-adj-body",
    display: "swap",
});
