import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Ticket as TicketIcon, Calendar, MapPin, Archive, Plus } from "lucide-react";
import Image from "next/image";
import { TicketForm } from "./ticket-form";

export default async function EventDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) redirect("/sign-in");

    const dbUser = await prisma.user.findUnique({
        where: { clerkId: userId },
    });

    if (!dbUser || (dbUser.role !== "ORGANIZER" && dbUser.role !== "ADMIN")) {
        redirect("/dashboard");
    }

    // Récupérer l'évènement avec ses billets
    const event = await prisma.event.findUnique({
        where: { id },
        include: { tickets: true },
    });

    if (!event) {
        return (
            <div className="max-w-5xl mx-auto py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">Évènement introuvable</h1>
                <Link href="/dashboard/events">
                    <Button>Retour aux évènements</Button>
                </Link>
            </div>
        );
    }

    if (dbUser.role !== "ADMIN" && event.organizerId !== dbUser.id) {
        redirect("/dashboard/events");
    }

    return (
        <div className="max-w-5xl mx-auto w-full pb-20">
            <div className="flex items-center mb-6">
                <Link href="/dashboard/events">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="w-4 h-4" /> Retour
                    </Button>
                </Link>
            </div>

            <div className="grid lg:grid-cols-[1fr_400px] gap-8">
                {/* Colonne de gauche : Infos & Aperçu */}
                <div className="space-y-6">
                    <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
                        <div className="relative h-[300px] bg-muted w-full">
                            {event.imageUrl ? (
                                <Image
                                    src={event.imageUrl}
                                    alt={event.title}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                    Sans image d'en-tête
                                </div>
                            )}
                        </div>
                        <div className="p-6 md:p-8">
                            <h1 className="text-3xl font-bold font-afo mb-4">{event.title}</h1>
                            
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                                <div className="flex items-center gap-2 bg-secondary/10 px-3 py-1.5 rounded-full text-secondary font-medium">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                        Du {new Date(event.startDate).toLocaleDateString("fr-FR")} au {new Date(event.endDate).toLocaleDateString("fr-FR")}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 border px-3 py-1.5 rounded-full">
                                    <MapPin className="w-4 h-4" />
                                    <span>{event.location}</span>
                                </div>
                            </div>

                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <h3 className="text-lg font-bold mb-2">Description</h3>
                                <p className="whitespace-pre-wrap">{event.description}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Colonne de droite : Gestion des Billets */}
                <div className="space-y-6">
                    <div className="bg-card border rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold font-afo flex items-center gap-2">
                                <TicketIcon className="w-5 h-5 text-primary" /> Billetterie
                            </h2>
                        </div>

                        {event.tickets.length === 0 ? (
                            <div className="text-center py-8 bg-muted/30 rounded-2xl border border-dashed mb-6">
                                <p className="text-muted-foreground text-sm">Aucun billet configuré pour cet évènement.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 mb-8">
                                {event.tickets.map((ticket) => (
                                    <div key={ticket.id} className="border rounded-xl p-4 flex justify-between items-start gap-4 hover:border-primary/50 transition-colors">
                                        <div>
                                            <h4 className="font-bold">{ticket.title}</h4>
                                            {ticket.description && <p className="text-xs text-muted-foreground mt-1">{ticket.description}</p>}
                                            <div className="flex gap-3 mt-2 text-xs">
                                                <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                                    {ticket.price === 0 ? "Gratuit" : `${ticket.price} FCFA`}
                                                </span>
                                                {ticket.totalStock && (
                                                    <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                                        Stock : {ticket.totalStock}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="border-t pt-6">
                            <h3 className="font-bold mb-4">Ajouter un nouveau billet</h3>
                            <TicketForm eventId={event.id} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
