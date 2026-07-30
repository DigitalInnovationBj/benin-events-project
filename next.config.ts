import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ["@react-pdf/renderer"],
    images: {
        unoptimized: true,
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
