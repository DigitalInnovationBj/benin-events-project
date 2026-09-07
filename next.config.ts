import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ["@react-pdf/renderer"],

    // `babel-plugin-react-compiler` était installé sans être activé.
    reactCompiler: true,

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
