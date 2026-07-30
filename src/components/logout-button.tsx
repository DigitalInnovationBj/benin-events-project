"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { SidebarMenuButton } from "./ui/sidebar";
import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
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

export function LogoutButton() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const handleSignOut = async () => {
        setIsLoading(true);
        // On redirige vers l'accueil après la déconnexion
        await authClient.signOut();
        router.push("/");
        router.refresh();
    };

    return (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogTrigger asChild>
                <SidebarMenuButton 
                    tooltip="Déconnexion"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <LogOut className="w-4 h-4" />
                    )}
                    <span>Déconnexion</span>
                </SidebarMenuButton>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Se déconnecter de Benin Events</AlertDialogTitle>
                    <AlertDialogDescription>
                        Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre espace de gestion.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={(e) => {
                            e.preventDefault();
                            handleSignOut();
                        }}
                        disabled={isLoading} 
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {isLoading ? "Déconnexion..." : "Oui, me déconnecter"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
