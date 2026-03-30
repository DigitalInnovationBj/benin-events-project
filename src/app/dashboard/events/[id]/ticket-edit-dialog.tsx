"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, Trash2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { updateTicket, deleteTicket } from "@/actions/ticket.actions";

type Ticket = {
    id: string;
    title: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    totalStock: number | null;
    eventId: string;
};

export function TicketEditDialog({ ticket }: { ticket: Ticket }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(
        ticket.imageUrl,
    );
    const [hasNewImage, setHasNewImage] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 1024 * 1024) {
            toast.error("L'image dépasse la limite de 1 Mo.");
            e.target.value = "";
            return;
        }
        setImagePreview(URL.createObjectURL(file));
        setHasNewImage(true);
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsUpdating(true);

        const formData = new FormData(e.currentTarget);
        formData.set("ticketId", ticket.id);

        try {
            const res = await updateTicket(formData);
            if (res.error) {
                toast.error(res.error);
                return;
            }
            toast.success("Billet mis à jour !");
            setIsOpen(false);
        } catch {
            toast.error("Erreur inattendue");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await deleteTicket(ticket.id);
            if (res.error) {
                toast.error(res.error);
                return;
            }
            toast.success("Billet supprimé.");
        } catch {
            toast.error("Erreur inattendue");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex items-center gap-2 shrink-0">
            {/* ── Bouton Modifier ───────────────────────────────── */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                        <Pencil className="w-4 h-4" />
                    </Button>
                </DialogTrigger>

                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Modifier le billet</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleUpdate} className="space-y-4 mt-2">
                        {/* Nom */}
                        <div className="grid gap-2">
                            <Label htmlFor={`title-${ticket.id}`}>
                                Nom du billet *
                            </Label>
                            <Input
                                id={`title-${ticket.id}`}
                                name="title"
                                defaultValue={ticket.title}
                                placeholder="Ex: Entrée Standard"
                                required
                            />
                        </div>

                        {/* Prix */}
                        <div className="grid gap-2">
                            <Label htmlFor={`price-${ticket.id}`}>
                                Prix (FCFA) *
                            </Label>
                            <Input
                                id={`price-${ticket.id}`}
                                name="price"
                                type="number"
                                min="0"
                                step="1"
                                defaultValue={ticket.price}
                                placeholder="0 pour gratuit"
                                required
                            />
                        </div>

                        {/* Stock */}
                        <div className="grid gap-2">
                            <Label htmlFor={`stock-${ticket.id}`}>
                                Stock total{" "}
                                <span className="text-muted-foreground font-normal">
                                    (Optionnel)
                                </span>
                            </Label>
                            <Input
                                id={`stock-${ticket.id}`}
                                name="totalStock"
                                type="number"
                                min="1"
                                step="1"
                                defaultValue={ticket.totalStock ?? ""}
                                placeholder="Laisser vide si illimité"
                            />
                        </div>

                        {/* Description */}
                        <div className="grid gap-2">
                            <Label htmlFor={`desc-${ticket.id}`}>
                                Description{" "}
                                <span className="text-muted-foreground font-normal">
                                    (Optionnel)
                                </span>
                            </Label>
                            <Textarea
                                id={`desc-${ticket.id}`}
                                name="description"
                                defaultValue={ticket.description ?? ""}
                                placeholder="Avantages inclus dans ce billet..."
                                className="min-h-20"
                            />
                        </div>

                        {/* Image */}
                        <div className="grid gap-2">
                            <Label htmlFor={`img-${ticket.id}`}>
                                Image illustrative{" "}
                                <span className="text-muted-foreground font-normal">
                                    (Max 1 Mo)
                                </span>
                            </Label>
                            <div className="border border-muted-foreground/25 rounded-xl text-center bg-muted/20 overflow-hidden relative">
                                <Input
                                    id={`img-${ticket.id}`}
                                    name="image"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                                <Label
                                    htmlFor={`img-${ticket.id}`}
                                    className={`cursor-pointer flex items-center justify-center gap-2 ${
                                        imagePreview ? "p-0 h-32" : "py-4"
                                    }`}
                                >
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Aperçu"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <>
                                            <ImagePlus className="w-5 h-5 text-muted-foreground" />
                                            <span className="text-xs font-medium">
                                                Changer l&apos;image
                                            </span>
                                        </>
                                    )}
                                </Label>
                            </div>
                            {imagePreview && (
                                <button
                                    type="button"
                                    className="text-xs text-muted-foreground hover:text-destructive text-left transition-colors"
                                    onClick={() => {
                                        setImagePreview(null);
                                        setHasNewImage(false);
                                    }}
                                >
                                    Retirer l&apos;image
                                </button>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => setIsOpen(false)}
                                disabled={isUpdating}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={isUpdating}
                            >
                                {isUpdating && (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                )}
                                {isUpdating ? "Mise à jour…" : "Enregistrer"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Bouton Supprimer ──────────────────────────────── */}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                    </Button>
                </AlertDialogTrigger>

                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Supprimer ce billet ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Le billet{" "}
                            <span className="font-semibold text-foreground">
                                &ldquo;{ticket.title}&rdquo;
                            </span>{" "}
                            sera définitivement supprimé. Cette action est
                            irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
