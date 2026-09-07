"use client";

import { useTheme } from "next-themes";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";

/**
 * Bascule clair / sombre.
 *
 * Le site est en sombre par défaut ; la préférence système n'est pas suivie
 * (`enableSystem={false}` dans le layout racine), il n'y a donc que deux
 * états à proposer.
 *
 * Le thème n'est connu qu'après hydratation (`next-themes` lit localStorage) :
 * tant que le composant n'est pas monté, on rend un bouton neutre de même
 * taille pour éviter à la fois un décalage de mise en page et une erreur
 * d'hydratation.
 */
export function ThemeToggle({ className }: { className?: string }) {
    const { resolvedTheme, setTheme } = useTheme();
    const hydrated = useHydrated();

    if (!hydrated) {
        return (
            <Button
                variant="ghost"
                size="icon"
                className={className}
                aria-hidden="true"
                tabIndex={-1}
            >
                <IconMoon className="w-4 h-4" />
            </Button>
        );
    }

    const isDark = resolvedTheme === "dark";

    return (
        <Button
            variant="ghost"
            size="icon"
            className={className}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={
                isDark ? "Passer au thème clair" : "Passer au thème sombre"
            }
        >
            {isDark ? (
                <IconSun className="w-4 h-4" aria-hidden="true" />
            ) : (
                <IconMoon className="w-4 h-4" aria-hidden="true" />
            )}
        </Button>
    );
}
