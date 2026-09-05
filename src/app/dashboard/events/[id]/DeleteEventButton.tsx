"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconLoader2 } from "@tabler/icons-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteEvent } from "@/actions/event.actions";
import { toast } from "sonner";

interface Props {
    eventId: string;
    eventTitle: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function DeleteEventButton({ eventId, eventTitle, open, onOpenChange }: Props) {
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
        <AlertDialog open={open} onOpenChange={onOpenChange}>
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
                            <IconLoader2 className="w-4 h-4 animate-spin" />
                        )}
                        {isDeleting ? "Suppression…" : "Oui, supprimer"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
