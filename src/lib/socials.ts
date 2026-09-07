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
    /** Classes de survol propres à la marque du réseau. */
    hoverColor: string;
};

// ─────────────────────────────────────────────
// Coordonnées publiques
// ─────────────────────────────────────────────

/** Identifiant utilisé à l'identique sur tous les réseaux. */
export const SOCIAL_HANDLE = "@beninevents.officiel";

/** Adresse professionnelle, référencée dans les pages légales. */
export const CONTACT_EMAIL = "contact@beninevents.com";

/** Seconde adresse de contact, mise en avant à côté de la première. */
export const CONTACT_EMAIL_ALT = "beninevents.officiel@gmail.com";

const USERNAME = "beninevents.officiel";

export const SOCIAL_LINKS: SocialLink[] = [
    {
        label: "Facebook",
        href: `https://facebook.com/${USERNAME}`,
        icon: IconBrandFacebook,
        handle: SOCIAL_HANDLE,
        hoverColor:
            "hover:border-blue-500/40 hover:bg-blue-500/5 hover:text-blue-500",
    },
    {
        label: "TikTok",
        href: `https://tiktok.com/@${USERNAME}`,
        icon: IconBrandTiktok,
        handle: SOCIAL_HANDLE,
        hoverColor:
            "hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground",
    },
    {
        label: "Instagram",
        href: `https://instagram.com/${USERNAME}`,
        icon: IconBrandInstagram,
        handle: SOCIAL_HANDLE,
        hoverColor:
            "hover:border-pink-500/40 hover:bg-pink-500/5 hover:text-pink-500",
    },
];
