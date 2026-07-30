"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Champ mot de passe avec bouton œil pour afficher/masquer la saisie.
 * Accepte toutes les props d'un <Input> hormis `type`, géré en interne.
 */
export function PasswordInput({
    className,
    ...props
}: Omit<React.ComponentProps<typeof Input>, "type">) {
    const [visible, setVisible] = React.useState(false);

    return (
        <div className="relative">
            <Input
                type={visible ? "text" : "password"}
                className={cn("pr-11", className)}
                {...props}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                tabIndex={-1}
                aria-label={
                    visible
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
                {visible ? (
                    <EyeOff className="h-4 w-4" />
                ) : (
                    <Eye className="h-4 w-4" />
                )}
            </button>
        </div>
    );
}
