import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, MapPin, ExternalLink } from "lucide-react";
import Image from "next/image";

export default async function EventsListPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const dbUser = await prisma.user.findUnique({
        where: { clerkId: userId },
    });

    if (!dbUser || (dbUser.role !== "ORGANIZER" && dbUser.role !== "ADMIN")) {
        redirect("/dashboard");
    }

    // Récupérer les évènements
    const events = await prisma.event.findMany({
        where: dbUser.role === "ADMIN" ? undefined : { organizerId: dbUser.id },
        orderBy: { startDate: "desc" },
    });

    return (
        <div className="max-w-5xl mx-auto w-full pb-10">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-afo text-foreground">
                        Mes Évènements
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gérez vos évènements et votre billetterie
                    </p>
                </div>
                <Link href="/dashboard/events/new">
                    <Button className="gap-2 shadow-sm">
                        <Plus className="w-4 h-4" /> Nouvel Évènement
                    </Button>
                </Link>
            </div>

            {events.length === 0 ? (
                <div className="bg-card border border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center">
                    <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <Calendar className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Aucun évènement</h2>
                    <p className="text-muted-foreground max-w-sm mb-6">
                        Vous n'avez pas encore créé d'évènement. Lancez-vous dès
                        maintenant !
                    </p>
                    <Link href="/dashboard/events/new">
                        <Button>Créer mon premier évènement</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {events.map((event) => (
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
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <h3
                                    className="font-bold text-lg mb-2 line-clamp-1"
                                    title={event.title}
                                >
                                    {event.title}
                                </h3>

                                <div className="space-y-2 mt-auto text-sm text-muted-foreground mb-6">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 shrink-0" />
                                        <span>
                                            {new Date(
                                                event.startDate,
                                            ).toLocaleDateString("fr-FR")}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 shrink-0" />
                                        <span className="line-clamp-1">
                                            {event.location}
                                        </span>
                                    </div>
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
                                            <ExternalLink className="w-4 h-4" />{" "}
                                            {/* Remplacer par ExternalLink si on a icon */}
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
