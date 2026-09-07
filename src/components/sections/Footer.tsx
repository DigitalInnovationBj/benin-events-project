import Link from "next/link";
import {
    IconMapPin,
    IconHeart,
    IconLayoutDashboard,
    IconCirclePlus,
    IconUserPlus,
    IconUserCircle,
    IconFileText,
    IconShieldCheck,
    IconFileDescription,
    IconCookie,
    IconHome,
    IconCalendarWeek,
    IconHelpCircle,
    IconMail,
    IconHeartHandshake,
} from "@tabler/icons-react";
import { SOCIAL_LINKS } from "@/lib/socials";

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────

const PLATEFORME_LINKS = [
    { label: "Accueil", href: "/", icon: IconHome },
    { label: "Évènements", href: "/events", icon: IconCalendarWeek },
    { label: "FAQ", href: "/faq", icon: IconHelpCircle },
    { label: "Contact", href: "/contact", icon: IconMail },
    { label: "Devenir partenaire", href: "/devenir-partenaire", icon: IconHeartHandshake },
];

const ORGANISATEURS_LINKS = [
    { label: "Dashboard", href: "/dashboard", icon: IconLayoutDashboard },
    {
        label: "Créer un évènement",
        href: "/dashboard/events/new",
        icon: IconCirclePlus,
    },
    {
        label: "Devenir organisateur",
        href: "/dashboard/demande-organisateur",
        icon: IconUserPlus,
    },
    { label: "Mon compte", href: "/mon-compte", icon: IconUserCircle },
];

const LEGAL_LINKS = [
    { label: "Mentions légales", href: "/mentions-legales", icon: IconFileText },
    { label: "Confidentialité", href: "/confidentialite", icon: IconShieldCheck },
    { label: "CGU", href: "/cgu", icon: IconFileDescription },
    { label: "Cookies", href: "/cookies", icon: IconCookie },
];

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function FooterHeading({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">
            {children}
        </h3>
    );
}

function FooterLink({
    href,
    icon: Icon,
    children,
}: {
    href: string;
    icon: React.ElementType;
    children: React.ReactNode;
}) {
    return (
        <li>
            <Link
                href={href}
                className="group flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
                <Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground/50 group-hover:text-secondary transition-colors duration-200" />
                {children}
            </Link>
        </li>
    );
}

// ─────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t bg-card">
            {/* ── Grid principal ──────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-6 md:px-12 py-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                    {/* ── Colonne brand ────────────────────────────────────── */}
                    <div className="sm:col-span-2 lg:col-span-1 flex flex-col gap-5">
                        {/* Logo */}
                        <Link
                            href="/"
                            className="font-afo text-4xl text-secondary leading-none hover:opacity-90 transition-opacity w-fit"
                        >
                            Benin Events
                        </Link>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                            La plateforme de référence pour découvrir, réserver
                            et organiser les meilleurs évènements du Bénin.
                        </p>

                        {/* Localisation */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                            <IconMapPin className="w-3.5 h-3.5 text-secondary shrink-0" />
                            Cotonou, République du Bénin
                        </div>

                        {/* Email */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                            <IconMail className="w-3.5 h-3.5 text-secondary shrink-0" />
                            <a
                                href="mailto:contact@beninevents.com"
                                className="text-secondary hover:underline transition-colors"
                            >
                                contact@beninevents.com
                            </a>
                        </div>

                        {/* Réseaux sociaux */}
                        <div className="flex items-center gap-2 pt-1">
                            {SOCIAL_LINKS.map((link) => {
                                const Icon = link.icon;
                                return (
                                    <a
                                        key={link.label}
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={link.label}
                                        className="w-9 h-9 rounded-xl border border-border/60 flex items-center justify-center text-muted-foreground hover:text-secondary hover:border-secondary/50 hover:bg-secondary/5 transition-all duration-200"
                                    >
                                        <Icon size={17} stroke={1.5} />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Colonne Plateforme ───────────────────────────────── */}
                    <div>
                        <FooterHeading>Plateforme</FooterHeading>
                        <ul className="space-y-3.5">
                            {PLATEFORME_LINKS.map((link) => (
                                <FooterLink
                                    key={link.href}
                                    href={link.href}
                                    icon={link.icon}
                                >
                                    {link.label}
                                </FooterLink>
                            ))}
                        </ul>
                    </div>

                    {/* ── Colonne Organisateurs ────────────────────────────── */}
                    <div>
                        <FooterHeading>Organisateurs</FooterHeading>
                        <ul className="space-y-3.5">
                            {ORGANISATEURS_LINKS.map((link) => (
                                <FooterLink
                                    key={link.href}
                                    href={link.href}
                                    icon={link.icon}
                                >
                                    {link.label}
                                </FooterLink>
                            ))}
                        </ul>
                    </div>

                    {/* ── Colonne Légal ────────────────────────────────────── */}
                    <div>
                        <FooterHeading>Légal</FooterHeading>
                        <ul className="space-y-3.5">
                            {LEGAL_LINKS.map((link) => (
                                <FooterLink
                                    key={link.href}
                                    href={link.href}
                                    icon={link.icon}
                                >
                                    {link.label}
                                </FooterLink>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* ── Séparateur ──────────────────────────────────────────────── */}
            <div className="border-t border-border/60" />

            {/* ── Barre de bas ────────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-6 md:px-12 py-5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground/60">
                    {/* Copyright */}
                    <div className="flex items-center gap-1.5">
                        <span>
                            &copy; {year}{" "}
                            <Link
                                href="/"
                                className="font-semibold text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Benin Events
                            </Link>
                            . Tous droits réservés.
                        </span>
                    </div>

                    {/* Made with love */}
                    <div className="flex items-center gap-1.5">
                        <span>Fait avec</span>
                        <IconHeart className="w-3 h-3 fill-green-600 text-green-600" />
                        <IconHeart className="w-3 h-3 fill-secondary text-secondary" />
                        <IconHeart className="w-3 h-3 fill-red-600 text-red-600" />
                        <a
                            href="https://digitalinnovation.bj"
                            target="_blank"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            par Digital Innovation
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
