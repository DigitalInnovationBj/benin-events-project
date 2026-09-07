"use client";

import { useTheme } from "next-themes";
import { useHydrated } from "@/hooks/use-hydrated";
import { IconSun, IconMoon, IconDeviceDesktop } from "@tabler/icons-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const OPTIONS = [
    { value: "light", label: "Clair", icon: IconSun },
    { value: "dark", label: "Sombre", icon: IconMoon },
    { value: "system", label: "Système", icon: IconDeviceDesktop },
] as const;

/**
 * Sélecteur de thème clair / sombre / système.
 *
 * Le thème n'est connu qu'après hydratation (`next-themes` lit localStorage) :
 * tant que le composant n'est pas monté, on rend un bouton neutre de même
 * taille pour éviter à la fois un décalage de mise en page et une erreur
 * d'hydratation.
 */
export function ThemeToggle({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme();
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
                <IconSun className="w-4 h-4" />
            </Button>
        );
    }

    const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[2];
    const CurrentIcon = current.icon;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={className}
                    aria-label={`Thème : ${current.label}. Changer de thème`}
                >
                    <CurrentIcon className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {OPTIONS.map(({ value, label, icon: Icon }) => (
                    <DropdownMenuItem
                        key={value}
                        onClick={() => setTheme(value)}
                        className={
                            theme === value ? "bg-accent font-semibold" : ""
                        }
                    >
                        <Icon className="w-4 h-4" aria-hidden="true" />
                        {label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
