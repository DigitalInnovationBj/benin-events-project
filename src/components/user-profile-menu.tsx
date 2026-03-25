"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

interface Props {
    name: string;
    email: string;
    imageUrl?: string;
}

export function UserProfileMenu({ name, email, imageUrl }: Props) {
    const { signOut } = useClerk();
    const router = useRouter();
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSignOut = async () => {
        setIsLoading(true);
        await signOut(() => router.push("/"));
    };

    const initials = name.substring(0, 2).toUpperCase();

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 flex items-center gap-2 pl-2 pr-4 rounded-full bg-secondary/10 hover:bg-secondary/20">
                        <Avatar className="h-8 w-8 border border-secondary/20">
                            <AvatarImage src={imageUrl} alt={name} />
                            <AvatarFallback className="bg-secondary text-primary font-bold text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground hidden sm:block">{name}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{name}</p>
                            <p className="text-xs leading-none text-muted-foreground line-clamp-1">{email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        className="text-destructive focus:bg-destructive/10 cursor-pointer" 
                        onSelect={(e) => {
                            e.preventDefault();
                            setIsAlertOpen(true);
                        }}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Se déconnecter</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
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
                            {isLoading ? "Déconnexion en cours..." : "Oui, me déconnecter"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
