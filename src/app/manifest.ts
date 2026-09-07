import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Benin Events",
        short_name: "Benin Events",
        description:
            "Découvrez, réservez et organisez les meilleurs évènements au Bénin.",
        start_url: "/",
        display: "standalone",
        background_color: "#251333",
        theme_color: "#251333",
        lang: "fr",
        categories: ["entertainment", "events"],
        icons: [
            {
                src: "/logo-be.png",
                sizes: "any",
                type: "image/png",
            },
        ],
    };
}
