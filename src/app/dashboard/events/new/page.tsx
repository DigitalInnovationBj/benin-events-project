"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, ImagePlus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { createEvent } from "@/actions/event.actions";

export default function NewEventPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Fonction de soumission du formulaire
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        
        try {
            const res = await createEvent(formData);

            if (res.error) {
                toast.error(res.error);
                setIsLoading(false);
                return;
            }

            toast.success("Évènement créé avec succès !");
            router.push(`/dashboard/events/${res.eventId}`); // Redirection vers la page de l'évènement pour ajouter des billets
        } catch (err) {
            toast.error("Erreur inattendue");
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-10">
            <div className="flex items-center mb-6">
                <Link href="/dashboard/events">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="w-4 h-4" /> Retour
                    </Button>
                </Link>
            </div>

            <div className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold font-afo text-foreground mb-2">Créer un nouvel évènement</h1>
                    <p className="text-muted-foreground">Remplissez les informations ci-dessous. Vous pourrez ajouter des billets par la suite.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Informations de base */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold border-b pb-2">Informations de l'évènement</h2>
                        
                        <div className="grid gap-2">
                            <Label htmlFor="title">Titre de l'évènement *</Label>
                            <Input id="title" name="title" placeholder="Ex: Concert de fin d'année" required />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea id="description" name="description" placeholder="Décrivez votre évènement en détail..." className="min-h-[120px]" required />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="location">Lieu *</Label>
                            <Input id="location" name="location" placeholder="Ex: Palais des Congrès, Cotonou" required />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="startDate">Date de début *</Label>
                                <Input id="startDate" name="startDate" type="datetime-local" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="endDate">Date de fin *</Label>
                                <Input id="endDate" name="endDate" type="datetime-local" required />
                            </div>
                        </div>
                    </div>

                    {/* Images et SEO */}
                    <div className="space-y-4 pt-4">
                        <h2 className="text-xl font-bold border-b pb-2">Images & Partage Réseaux Sociaux</h2>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="image" className="mb-2">Image de l'évènement *</Label>
                                <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-4 text-center hover:bg-muted/50 transition-colors">
                                    <Input id="image" name="image" type="file" accept="image/*" className="hidden" required />
                                    <Label htmlFor="image" className="cursor-pointer flex flex-col items-center justify-center gap-2 py-4">
                                        <ImagePlus className="w-8 h-8 text-muted-foreground" />
                                        <span className="text-sm font-medium">Cliquez pour ajouter une image</span>
                                    </Label>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="ogImage" className="mb-2">Image de Partage (Optionnel)</Label>
                                <div className="border border-muted-foreground/25 rounded-xl p-4 text-center bg-muted/20">
                                    <Input id="ogImage" name="ogImage" type="file" accept="image/*" className="hidden" />
                                    <Label htmlFor="ogImage" className="cursor-pointer flex flex-col items-center justify-center gap-2 py-4">
                                        <ImagePlus className="w-8 h-8 text-muted-foreground" />
                                        <span className="text-sm font-medium">Image pour Facebook/WhatsApp...</span>
                                    </Label>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2 mt-4">
                            <Label htmlFor="ogTitle">Titre de l'évènement pour le partage (Optionnel)</Label>
                            <Input id="ogTitle" name="ogTitle" placeholder="Titre alternatif utilisé lors du partage sur les réseaux" />
                            <p className="text-xs text-muted-foreground">Si vide, le titre principal sera utilisé.</p>
                        </div>
                    </div>

                    <Button type="submit" disabled={isLoading} size="lg" className="w-full">
                        {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                        {isLoading ? "Création en cours..." : "Créer l'évènement et continuer"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
