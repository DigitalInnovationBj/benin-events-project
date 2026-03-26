import { Metadata } from "next";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Search, List, Grid, Calendar, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import EventCountdown from "@/components/events/event-countdown";

interface Event {
    id: string;
    slug: string;
    title: string;
    description: string;
    imageUrl?: string | null;
    location: string;
    startDate: Date;
    endDate: Date;
    organizer: {
        name: string;
    };
    tickets: Array<{
        price: number;
    }>;
}

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Tous les évènements | Benin Events",
        description:
            "Découvrez tous les évènements à venir au Bénin. Concerts, festivals, conférences et bien plus.",
    };
}

export default async function EventsPage() {
    const events = (await prisma.event.findMany({
        where: {
            startDate: {
                gte: new Date(), // Événements futurs seulement
            },
        },
        orderBy: {
            startDate: "asc",
        },
        include: {
            organizer: true,
            tickets: true,
        },
    })) as Event[];

    const hasEvents = events.length > 0;

    return (
        <main className="min-h-screen bg-background">
            {/* Header et Filtres */}
            <div className="border-b bg-card">
                <div className="max-w-6xl mx-auto px-6 py-8 md:px-12">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <h1 className="text-5xl md:text-6xl font-afo mb-2">
                                Évènements
                            </h1>
                            <p className="text-xl text-muted-foreground">
                                {hasEvents
                                    ? `${events.length} évènements à venir`
                                    : "Aucun évènement pour le moment"}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Rechercher un évènement..."
                                    className="pl-10 w-full sm:w-64"
                                />
                            </div>
                            <Select defaultValue="all">
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Catégorie" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toutes</SelectItem>
                                    <SelectItem value="concert">
                                        Concerts
                                    </SelectItem>
                                    <SelectItem value="festival">
                                        Festivals
                                    </SelectItem>
                                    <SelectItem value="conference">
                                        Conférences
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contrôles de vue */}
            <div className="max-w-6xl mx-auto px-6 py-6 md:px-12">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Switch id="grid-view" defaultChecked />
                        <label
                            htmlFor="grid-view"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Vue grille
                        </label>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <List className="w-4 h-4" />
                            <span className="sr-only">Vue liste</span>
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Grid className="w-4 h-4" />
                            <span className="sr-only">Vue grille</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Grille d'événements (par défaut) */}
            <div className="max-w-6xl mx-auto px-6 pb-16 md:px-12">
                {hasEvents ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {events.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24">
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-2xl font-bold mb-2">
                            Aucun évènement trouvé
                        </h3>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                            Restez à l'affût ! De nouveaux évènements seront
                            bientôt disponibles.
                        </p>
                        <Button asChild>
                            <Link href="/">Retour à l'accueil</Link>
                        </Button>
                    </div>
                )}
            </div>
        </main>
    );
}

interface EventCardProps {
    event: Event;
}

function EventCard({ event }: EventCardProps) {
    const firstTicketPrice = event.tickets[0]?.price || 0;
    const isFree = firstTicketPrice === 0;
    const startLabel = new Date(event.startDate).toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Porto-Novo",
    });

    return (
        <Link href={`/events/${event.slug}`} className="group">
            <Card className="h-full overflow-hidden border-2 border-transparent hover:border-secondary/50 hover:shadow-xl transition-all duration-300 bg-card hover:bg-card/50">
                <CardHeader className="p-0 relative h-48 overflow-hidden">
                    {event.imageUrl ? (
                        <Image
                            src={event.imageUrl}
                            alt={event.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Calendar className="w-12 h-12 text-muted-foreground" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                        <EventCountdown
                            startDate={event.startDate.toISOString()}
                        />
                    </div>
                </CardHeader>

                <CardContent className="p-6 pt-0 pb-8 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-secondary" />
                        <span className="text-xs text-muted-foreground truncate">
                            {event.location}
                        </span>
                    </div>

                    <CardTitle className="font-afo text-xl leading-tight line-clamp-2 group-hover:text-foreground transition-colors">
                        {event.title}
                    </CardTitle>

                    <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                        {event.description}
                    </CardDescription>

                    <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-secondary">
                                {isFree
                                    ? "Gratuit"
                                    : `${firstTicketPrice} FCFA`}
                            </span>
                            {!isFree && (
                                <Badge variant="secondary" className="text-xs">
                                    Dès
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span>Par {event.organizer.name}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <div className="text-xs bg-muted px-2 py-1 rounded-full">
                            {startLabel}
                        </div>
                        <div className="h-4 w-px bg-muted" />
                        <Badge>
                            {event.tickets.length} billet
                            {event.tickets.length > 1 ? "s" : ""}
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
