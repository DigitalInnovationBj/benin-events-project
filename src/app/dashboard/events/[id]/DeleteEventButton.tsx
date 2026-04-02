"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { deleteEvent } from "@/actions/event.actions";
import { toast } from "sonner";

interface Props {
    eventId: string;
    eventTitle: string;
}

export default function DeleteEventButton({ eventId, eventTitle }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setIsDeleting(true);

        const result = await deleteEvent(eventId);

        if (result?.error) {
            toast.error(result.error);
            setIsDeleting(false);
        } else {
            toast.success("Évènement supprimé avec succès.");
            router.push("/dashboard/events");
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Trash2 className="w-4 h-4" />
                    )}
                    Supprimer
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Supprimer cet évènement ?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        L&apos;évènement{" "}
                        <span className="font-semibold text-foreground">
                            &ldquo;{eventTitle}&rdquo;
                        </span>{" "}
                        sera retiré de la plateforme et ne sera plus visible par
                        les participants. Cette action est irréversible.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                        Annuler
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={isDeleting}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2"
                    >
                        {isDeleting && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        {isDeleting ? "Suppression…" : "Oui, supprimer"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
