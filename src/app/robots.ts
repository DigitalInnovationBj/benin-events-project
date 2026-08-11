import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: [
                "/dashboard",
                "/admin",
                "/agent",
                "/api",
                "/checkout",
                "/sign-in",
                "/sign-up",
                "/forgot-password",
                "/reset-password",
                "/verify-email",
            ],
        },
        sitemap: `${APP_URL}/sitemap.xml`,
    };
}
