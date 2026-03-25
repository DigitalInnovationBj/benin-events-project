"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";

export function LogoutButton({ className }: { className?: string }) {
    const { signOut } = useClerk();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSignOut = async () => {
        setIsLoading(true);
        // On redirige vers l'accueil après la déconnexion
        await signOut(() => router.push("/"));
    };

    return (
        <Button 
            variant="ghost" 
            onClick={handleSignOut} 
            disabled={isLoading} 
            className={`text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ${className || ""}`}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
                <LogOut className="w-4 h-4 mr-2" />
            )}
            Déconnexion
        </Button>
    );
}
