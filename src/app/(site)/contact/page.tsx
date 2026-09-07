import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import {
    IconMail,
    IconMapPin,
    IconClock,
    IconMessage,
} from "@tabler/icons-react";
import {
    SOCIAL_LINKS,
    CONTACT_EMAIL,
    CONTACT_EMAIL_ALT,
} from "@/lib/socials";

export const metadata: Metadata = {
    title: "Contact | Benin Events",
    description:
        "Contactez l'équipe Benin Events pour toute question, partenariat ou signalement.",
};


export default function ContactPage() {
    return (
        <div className="bg-background">

            {/* ── En-tête ─────────────────────────────────────────────── */}
            <div className="border-b bg-card">
                <div className="max-w-6xl mx-auto px-6 py-8 md:px-12">
                    <div className="flex items-center gap-2 mb-2">
                        <IconMessage className="w-4 h-4 text-secondary" />
                        <span className="text-secondary text-xs font-bold uppercase tracking-widest">
                            Support
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-afo mb-1">
                        Contactez-nous
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Notre équipe vous répond sous 24 heures ouvrées
                    </p>
                </div>
            </div>

            {/* ── Contenu ─────────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-6 md:px-12 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-start">

                    {/* ── Formulaire (3/5) ──────────────────────────────── */}
                    <div className="lg:col-span-3">
                        <div className="rounded-3xl border bg-card p-8">
                            <h2 className="font-afo text-3xl mb-1">
                                Envoyer un message
                            </h2>
                            <p className="text-muted-foreground text-sm mb-8">
                                Remplissez le formulaire ci-dessous et nous vous
                                répondrons dans les meilleurs délais.
                            </p>
                            <ContactForm />
                        </div>
                    </div>

                    {/* ── Infos (2/5) ───────────────────────────────────── */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Email */}
                        <div className="rounded-2xl border bg-card p-5 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <IconMail className="w-5 h-5 text-secondary" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm mb-0.5">
                                    E-mail
                                </p>
                                <a
                                    href={`mailto:${CONTACT_EMAIL}`}
                                    className="block text-sm text-secondary hover:underline break-all"
                                >
                                    {CONTACT_EMAIL}
                                </a>
                                <a
                                    href={`mailto:${CONTACT_EMAIL_ALT}`}
                                    className="block text-sm text-secondary hover:underline break-all"
                                >
                                    {CONTACT_EMAIL_ALT}
                                </a>
                            </div>
                        </div>

                        {/* Adresse */}
                        <div className="rounded-2xl border bg-card p-5 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <IconMapPin className="w-5 h-5 text-secondary" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm mb-0.5">
                                    Adresse
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Cotonou, République du Bénin
                                </p>
                            </div>
                        </div>

                        {/* Délai de réponse */}
                        <div className="rounded-2xl border bg-card p-5 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <IconClock className="w-5 h-5 text-secondary" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm mb-0.5">
                                    Délai de réponse
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Généralement sous 24 h ouvrées
                                </p>
                            </div>
                        </div>

                        {/* Réseaux sociaux */}
                        <div className="rounded-2xl border bg-card p-5">
                            <p className="font-semibold text-sm mb-4">
                                Nous suivre
                            </p>
                            <div className="space-y-3">
                                {SOCIAL_LINKS.map((link) => {
                                    const Icon = link.icon;
                                    return (
                                        <a
                                            key={link.label}
                                            href={link.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-center gap-3 rounded-xl border border-border/60 px-4 py-3 text-muted-foreground transition-all duration-200 ${link.hoverColor}`}
                                        >
                                            <Icon size={20} stroke={1.5} />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold leading-tight">
                                                    {link.label}
                                                </span>
                                                <span className="text-xs opacity-60">
                                                    {link.handle}
                                                </span>
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
