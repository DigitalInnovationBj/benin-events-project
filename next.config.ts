import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ["@react-pdf/renderer"],
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: "https",
                hostname: "img.clerk.com",
            },
            {
                protocol: "https",
                hostname: "*.public.blob.vercel-storage.com",
            },
        ],
    },
};

export default nextConfig;
