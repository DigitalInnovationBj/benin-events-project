import Link from "next/link";
import {
    IconSearch,
    IconTicket,
    IconConfetti,
    IconCirclePlus,
    IconSpeakerphone,
    IconChartBar,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import type { ComponentType } from "react";

const PARTICIPANT_STEPS: {
    number: string;
    icon: ComponentType<{ className?: string }>;
    title: string;
    description: string;
}[] = [
    {
        number: "01",
        icon: IconSearch,
        title: "Découvrez",
        description:
            "Explorez des centaines d'évènements au Bénin par catégorie, ville ou date.",
    },
    {
        number: "02",
        icon: IconTicket,
        title: "Réservez",
        description:
            "Choisissez votre billet en quelques clics et recevez votre confirmation.",
    },
    {
        number: "03",
        icon: IconConfetti,
        title: "Participez",
        description:
            "Vivez des expériences inoubliables et partagez-les avec votre communauté.",
    },
];

const ORGANIZER_STEPS: {
    number: string;
    icon: ComponentType<{ className?: string }>;
    title: string;
    description: string;
}[] = [
    {
        number: "01",
        icon: IconCirclePlus,
        title: "Créez",
        description:
            "Publiez votre évènement avec photos, billets, lieu et description complète.",
    },
    {
        number: "02",
        icon: IconSpeakerphone,
        title: "Promouvez",
        description:
            "Touchez des milliers de participants potentiels à travers tout le Bénin.",
    },
    {
        number: "03",
        icon: IconChartBar,
        title: "Gérez",
        description:
            "Suivez vos ventes et interagissez avec votre audience en temps réel.",
    },
];

export default function HowItWorksSection() {
    return (
        <section className="py-20 border-t bg-card">
            <div className="max-w-6xl mx-auto px-6 md:px-12">
                <h2 className="font-afo text-4xl md:text-5xl text-center mb-3">
                    Comment ça marche ?
                </h2>
                <p className="text-muted-foreground text-center mb-14 max-w-xl mx-auto text-sm leading-relaxed">
                    Que vous soyez participant ou organisateur, Benin Events
                    simplifie chaque étape.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-0">
                    {/* Participants */}
                    <div className="lg:pr-16">
                        <span className="text-sm font-bold text-secondary uppercase tracking-widest mb-8 block">
                            Pour les participants
                        </span>
                        <div className="space-y-8">
                            {PARTICIPANT_STEPS.map((step) => (
                                <div
                                    key={step.number}
                                    className="flex gap-5 items-start"
                                >
                                    <div className="relative shrink-0 w-14">
                                        <span className="font-afo text-6xl text-secondary/15 leading-none select-none absolute -top-2 left-0">
                                            {step.number}
                                        </span>
                                        <div className="relative z-10 w-10 h-10 mt-2 ml-1 rounded-xl bg-secondary/10 flex items-center justify-center">
                                            <step.icon className="w-5 h-5 text-secondary" />
                                        </div>
                                    </div>
                                    <div className="pt-1.5">
                                        <h3 className="font-bold text-lg mb-1">
                                            {step.title}
                                        </h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button
                            asChild
                            size="lg"
                            variant="secondary"
                            className="rounded-2xl gap-2 mt-10"
                        >
                            <Link href="/events">Voir les évènements</Link>
                        </Button>
                    </div>

                    {/* Organisateurs */}
                    <div className="lg:border-l lg:pl-16">
                        <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-8 block">
                            Pour les organisateurs
                        </span>
                        <div className="space-y-8">
                            {ORGANIZER_STEPS.map((step) => (
                                <div
                                    key={step.number}
                                    className="flex gap-5 items-start"
                                >
                                    <div className="relative shrink-0 w-14">
                                        <span className="font-afo text-6xl text-secondary/10 leading-none select-none absolute -top-2 left-0">
                                            {step.number}
                                        </span>
                                        <div className="relative z-10 w-10 h-10 mt-2 ml-1 rounded-xl bg-secondary/8 flex items-center justify-center">
                                            <step.icon className="w-5 h-5 text-secondary/60" />
                                        </div>
                                    </div>
                                    <div className="pt-1.5">
                                        <h3 className="font-bold text-lg mb-1">
                                            {step.title}
                                        </h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="rounded-2xl gap-2 mt-10"
                        >
                            <Link href="/dashboard">Créer un évènement</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
