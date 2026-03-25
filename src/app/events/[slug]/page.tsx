import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Calendar, MapPin, Share2, Ticket as TicketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;

    const event = await prisma.event.findUnique({
        where: { slug },
    });

    if (!event) return { title: "Évènement introuvable" };

    return {
        title: `${event.ogTitle || event.title} | Benin Events`,
        description: event.description.substring(0, 160) + "...",
        openGraph: {
            title: event.ogTitle || event.title,
            description: event.description.substring(0, 160) + "...",
            images: event.ogImage || event.imageUrl ? [event.ogImage || event.imageUrl as string] : [],
        },
        twitter: {
            card: "summary_large_image",
            title: event.ogTitle || event.title,
            description: event.description.substring(0, 160) + "...",
            images: event.ogImage || event.imageUrl ? [event.ogImage || event.imageUrl as string] : [],
        },
    };
}

export default async function PublicEventPage({ params }: Props) {
    const { slug } = await params;

    const event = await prisma.event.findUnique({
        where: { slug },
        include: {
            organizer: true,
            tickets: true,
        },
    });

    if (!event) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-background">
            {/* Héro Section */}
            <div className="relative w-full h-[40vh] md:h-[60vh] bg-muted">
                {event.imageUrl ? (
                    <Image
                        src={event.imageUrl}
                        alt={event.title}
                        fill
                        priority
                        className="object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        Aucune image fournie
                    </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-background via-background/20 to-transparent" />
                
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 max-w-6xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-afo text-foreground mb-4 drop-shadow-lg">
                        {event.title}
                    </h1>
                    <div className="flex flex-wrap gap-4 text-sm md:text-base font-medium">
                        <div className="flex items-center gap-2 bg-background/80 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                            <Calendar className="w-5 h-5 text-primary" />
                            <span>{new Date(event.startDate).toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'})}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-background/80 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                            <MapPin className="w-5 h-5 text-secondary" />
                            <span>{event.location}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenu */}
            <div className="max-w-6xl mx-auto p-6 md:p-12 grid lg:grid-cols-[1fr_400px] gap-12">
                <div className="space-y-10">
                    <section>
                        <h2 className="text-2xl font-afo mb-4">À propos de cet évènement</h2>
                        <div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap text-muted-foreground">
                            {event.description}
                        </div>
                    </section>
                    
                    <section className="bg-card border rounded-2xl p-6 shadow-sm flex items-center gap-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                            {event.organizer.name?.[0] || "O"}
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Organisé par</p>
                            <p className="font-bold text-lg">{event.organizer.name || "Organisateur anonyme"}</p>
                        </div>
                        <Button variant="outline" size="icon" className="ml-auto rounded-full">
                            <Share2 className="w-4 h-4" />
                        </Button>
                    </section>
                </div>

                {/* Billetterie Sticky Sidebar */}
                <div className="relative">
                    <div className="sticky top-24 space-y-6">
                        <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-xl">
                            <h3 className="text-2xl font-afo mb-6 flex items-center gap-2">
                                <TicketIcon className="w-6 h-6 text-primary" /> Billetterie
                            </h3>
                            
                            {event.tickets.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4 bg-muted/30 rounded-xl border border-dashed">
                                    Aucun billet en vente pour le moment.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {event.tickets.map((ticket) => (
                                        <div key={ticket.id} className="border rounded-2xl p-5 hover:border-primary/40 transition-colors">
                                            <h4 className="font-bold text-lg">{ticket.title}</h4>
                                            {ticket.description && <p className="text-sm text-muted-foreground mt-1 mb-3">{ticket.description}</p>}
                                            <div className="flex items-center justify-between mt-4">
                                                <span className="font-bold text-xl text-primary">
                                                    {ticket.price === 0 ? "Gratuit" : `${ticket.price} FCFA`}
                                                </span>
                                                <Button>Acheter</Button>
                                            </div>
                                            {ticket.totalStock && (
                                                <p className="text-xs text-muted-foreground mt-3 text-right">
                                                    Restant : <span className="font-medium text-foreground">{ticket.totalStock}</span>
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
