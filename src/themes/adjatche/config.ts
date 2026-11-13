/**
 * Adjatchè Urban Festival — contenus de l'habillage.
 *
 * Textes repris de l'affiche officielle ; les images sont dans
 * public/events/adjatche (web) et src/assets/tickets/adjatche (PDF).
 */
export const ADJATCHE = {
    colors: {
        navy: "#132a88",
        navyDeep: "#0b1b5e",
        royal: "#052dca",
        orange: "#ef7d19",
        ink: "#4a5590",
    },
    tagline: "Racine & Modernité",
    /** Dates telles qu'écrites sur l'affiche : « DU 18 AU 20 DEC 2026 ». */
    dates: { from: "18", to: "20", month: "DEC", year: "2026" },
    city: "Porto-Novo",
    venue: "Albarika · Porto-Novo",
    contact: "+229 01 47 43 43 36",
    coorganizers: [
        { name: "Naode Monde", web: "/events/adjatche/naode.webp", pdf: "naode.png", webHeight: 64, pdfHeight: 18 },
        { name: "Like+ Africa", web: "/events/adjatche/like-plus.webp", pdf: "like-plus.png", webHeight: 40, pdfHeight: 11 },
    ],
} as const;
