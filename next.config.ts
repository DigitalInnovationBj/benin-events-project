import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ["@react-pdf/renderer"],

    // Polices et images lues depuis le disque par les billets PDF
    // (path.join(process.cwd(), …)) : on les embarque explicitement dans les
    // fonctions serverless, le traçage automatique ne suivant pas ces chemins.
    outputFileTracingIncludes: {
        "/**": ["./src/app/fonts/**", "./src/assets/tickets/**"],
    },

    // `babel-plugin-react-compiler` était installé sans être activé.
    reactCompiler: true,

    // Visuels des billets imprimés (PNG 300 dpi, jusqu'à 4 Mo) envoyés par
    // Server Action. 4,5 Mo = plafond du corps de requête des fonctions Vercel.
    experimental: {
        serverActions: {
            bodySizeLimit: "4.5mb",
        },
    },

    images: {
        // Auparavant `unoptimized: true`, ce qui annulait tout l'intérêt de
        // next/image sur un site entièrement visuel : ni redimensionnement,
        // ni AVIF/WebP, ni srcset — les remotePatterns ci-dessous ne servaient
        // donc à rien.
        formats: ["image/avif", "image/webp"],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "*.public.blob.vercel-storage.com",
            },
            // Avatars fournis par Google lors de la connexion sociale
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
            },
        ],
    },
};

export default nextConfig;
