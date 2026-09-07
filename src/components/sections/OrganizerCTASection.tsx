import prisma from "@/lib/prisma";
import Link from "next/link";
import {
    IconArrowRight,
    IconCalendar,
    IconUsers,
    IconTag,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export default async function OrganizerCTASection() {
    const [eventCount, organizerCount, categoryCount] = await Promise.all([
        prisma.event.count({ where: { startDate: { gte: new Date() } } }),
        prisma.user.count({ where: { role: "ORGANIZER" } }),
        prisma.category.count(),
    ]);

    const stats = [
        {
            icon: IconCalendar,
            value: eventCount,
            label: "Évènements à venir",
        },
        {
            icon: IconUsers,
            value: organizerCount,
            label: "Organisateurs actifs",
        },
        {
            icon: IconTag,
            value: categoryCount,
            label: "Catégories",
        },
    ];

    return (
        <section className="py-20 border-t bg-primary text-primary-foreground overflow-hidden relative">
            {/* Blobs décoratifs */}
            <div
                className="pointer-events-none absolute inset-0 overflow-hidden"
                aria-hidden
            >
                <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />
                <div className="absolute bottom-0 -left-24 h-72 w-72 rounded-full bg-secondary/8 blur-3xl" />
            </div>

            <div className="relative max-w-6xl mx-auto px-6 md:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
                    {/* Gauche : texte + CTAs */}
                    <div>
                        <span className="text-secondary text-xs font-bold uppercase tracking-widest mb-4 block">
                            Pour les organisateurs
                        </span>
                        <h2 className="font-afo text-4xl md:text-5xl lg:text-6xl leading-none mb-5">
                            Vous organisez des évènements ?
                        </h2>
                        <p className="text-primary-foreground/60 mb-8 max-w-md leading-relaxed text-sm">
                            Rejoignez les organisateurs qui font confiance à
                            Benin Events pour toucher leur audience, vendre
                            leurs billets et faire rayonner leurs évènements à
                            travers tout le Bénin.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                asChild
                                size="lg"
                                variant="secondary"
                                className="rounded-2xl gap-2 shadow-lg"
                            >
                                <Link href="/dashboard">
                                    Créer mon premier évènement
                                    <IconArrowRight className="w-4 h-4" />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="rounded-2xl border-primary-foreground/25 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                            >
                                <Link href="/dashboard/demande-organisateur">
                                    Devenir organisateur
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Droite : stats */}
                    <div className="flex flex-col gap-4">
                        {stats.map((stat) => (
                            <div
                                key={stat.label}
                                className="flex items-center gap-5 rounded-2xl bg-primary-foreground/5 border border-primary-foreground/10 px-6 py-5"
                            >
                                <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center shrink-0">
                                    <stat.icon className="w-6 h-6 text-secondary" />
                                </div>
                                <div>
                                    <p className="font-afo text-4xl text-secondary leading-none mb-0.5">
                                        {stat.value.toLocaleString("fr-FR")}
                                    </p>
                                    <p className="text-primary-foreground/55 text-sm">
                                        {stat.label}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
