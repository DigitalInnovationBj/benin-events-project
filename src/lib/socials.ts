import type { ElementType } from "react";
import {
    IconBrandFacebook,
    IconBrandTiktok,
    IconBrandInstagram,
} from "@tabler/icons-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type SocialLink = {
    label: string;
    href: string;
    icon: ElementType;
    handle: string;
};

// ─────────────────────────────────────────────
// Data — à mettre à jour avec les vrais URLs
// ─────────────────────────────────────────────

export const SOCIAL_LINKS: SocialLink[] = [
    {
        label: "Facebook",
        href: "https://facebook.com/beninevents",
        icon: IconBrandFacebook,
        handle: "Benin Events",
    },
    {
        label: "TikTok",
        href: "https://tiktok.com/@beninevents",
        icon: IconBrandTiktok,
        handle: "@beninevents",
    },
    {
        label: "Instagram",
        href: "https://instagram.com/beninevents",
        icon: IconBrandInstagram,
        handle: "@beninevents",
    },
];
