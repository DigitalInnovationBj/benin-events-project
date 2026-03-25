"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { createTicket } from "@/actions/ticket.actions";

export function TicketForm({ eventId }: { eventId: string }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.append("eventId", eventId);
        
        try {
            const res = await createTicket(formData);

            if (res.error) {
                toast.error(res.error);
                setIsLoading(false);
                return;
            }

            toast.success("Billet ajouté avec succès !");
            (e.target as HTMLFormElement).reset();
        } catch (err) {
            toast.error("Erreur inattendue");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="title">Nom du billet *</Label>
                <Input id="title" name="title" placeholder="Ex: Entrée Standard" required />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="price">Prix (FCFA) *</Label>
                <Input id="price" name="price" type="number" min="0" step="1" placeholder="Ex: 5000 (0 pour gratuit)" required />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="totalStock">Stock total (Optionnel)</Label>
                <Input id="totalStock" name="totalStock" type="number" min="1" step="1" placeholder="Ex: 100 (Laisser vide si illimité)" />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Description (Optionnel)</Label>
                <Textarea id="description" name="description" placeholder="Avantages inclus dans ce billet..." className="min-h-[80px]" />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="ticketImage" className="mb-1">Image illustrative (Optionnel)</Label>
                <div className="border border-muted-foreground/25 rounded-xl p-3 text-center bg-muted/20">
                    <Input id="ticketImage" name="image" type="file" accept="image/*" className="hidden" />
                    <Label htmlFor="ticketImage" className="cursor-pointer flex items-center justify-center gap-2 py-2">
                        <ImagePlus className="w-5 h-5 text-muted-foreground" />
                        <span className="text-xs font-medium">Ajouter une image</span>
                    </Label>
                </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {isLoading ? "Ajout en cours..." : "Créer le billet"}
            </Button>
        </form>
    );
}
