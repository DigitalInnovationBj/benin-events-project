import { getCurrentUser } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import {
    IconPlus,
    IconCalendarEvent,
    IconMapPin,
    IconExternalLink,
    IconUserCircle,
    IconStar,
} from "@tabler/icons-react";
import type { ComponentType } from "react";
import Image from "next/image";

function eventStatus(event: { isCancelled: boolean; isPublished: boolean }): {
    tone: StatusTone;
    label: string;
} {
    if (event.isCancelled) return { tone: "danger", label: "Annulée" };
    if (!event.isPublished) return { tone: "warning", label: "Brouillon" };
    return { tone: "success", label: "Publiée" };
}

export default async function EventsListPage() {
    const dbUser = await getCurrentUser();

    if (!dbUser) {
        redirect("/sign-in");
    }

    if (dbUser.role !== "ORGANIZER" && dbUser.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const isAdmin = dbUser.role === "ADMIN";

    const events = await prisma.event.findMany({
        where: isAdmin
            ? { isDeleted: false }
            : { organizerId: dbUser.id, isDeleted: false },
        orderBy: { startDate: "desc" },
        include: { organizer: { select: { name: true, email: true } } },
    });

    return (
        <div className="max-w-5xl mx-auto w-full pb-10">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-afo text-foreground">
                        {isAdmin ? "Tous les évènements" : "Mes évènements"}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {isAdmin
                            ? "Vue d'ensemble des évènements créés par tous les organisateurs"
                            : "Gérez vos évènements et votre billetterie"}
                    </p>
                </div>
                <Link href="/dashboard/events/new">
                    <Button className="gap-2 shadow-sm">
                        <IconPlus className="w-4 h-4" /> Nouvel évènement
                    </Button>
                </Link>
            </div>

            {events.length === 0 ? (
                <div className="bg-card border border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center">
                    <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <IconCalendarEvent className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Aucun évènement</h2>
                    <p className="text-muted-foreground max-w-sm mb-6">
                        {isAdmin
                            ? "Aucun évènement n'a encore été créé sur la plateforme."
                            : "Vous n'avez pas encore créé d'évènement. Lancez-vous dès maintenant !"}
                    </p>
                    {!isAdmin && (
                        <Link href="/dashboard/events/new">
                            <Button>Créer mon premier évènement</Button>
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {events.map((event) => {
                        const status = eventStatus(event);
                        return (
                            <div
                                key={event.id}
                                className="bg-card border rounded-2xl overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-md group"
                            >
                                <div className="relative h-48 bg-muted w-full overflow-hidden">
                                    {event.imageUrl ? (
                                        <Image
                                            src={event.imageUrl}
                                            alt={event.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                            Sans image
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                                        <StatusBadge tone={status.tone} label={status.label} />
                                        {event.isFeatured && (
                                            <StatusBadge
                                                tone="info"
                                                label="Vedette"
                                                icon={IconStar as ComponentType<{ className?: string }>}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3
                                        className="font-bold text-lg mb-2 line-clamp-1"
                                        title={event.title}
                                    >
                                        {event.title}
                                    </h3>

                                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                                        <div className="flex items-center gap-2">
                                            <IconCalendarEvent className="w-4 h-4 shrink-0" />
                                            <span>
                                                {new Date(
                                                    event.startDate,
                                                ).toLocaleDateString("fr-FR")}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <IconMapPin className="w-4 h-4 shrink-0" />
                                            <span className="line-clamp-1">
                                                {event.location || "En ligne"}
                                            </span>
                                        </div>
                                        {isAdmin && (
                                            <div className="flex items-center gap-2">
                                                <IconUserCircle className="w-4 h-4 shrink-0" />
                                                <span className="line-clamp-1">
                                                    {event.organizer.name} ({event.organizer.email})
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 mt-auto">
                                        <Link
                                            href={`/dashboard/events/${event.id}`}
                                            className="flex-1"
                                        >
                                            <Button
                                                variant="secondary"
                                                className="w-full"
                                            >
                                                Gérer
                                            </Button>
                                        </Link>
                                        <Link
                                            href={`/events/${event.slug}`}
                                            target="_blank"
                                        >
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                title="Voir la page publique"
                                            >
                                                <IconExternalLink className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
