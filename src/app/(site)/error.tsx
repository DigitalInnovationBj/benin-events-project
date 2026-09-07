"use client"; // Une limite d'erreur doit être un Client Component

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";

export default function SiteError({
    error,
    unstable_retry,
}: {
    error: Error & { digest?: string };
    unstable_retry: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
            <div className="max-w-md w-full text-center space-y-6">
                <IconAlertTriangle
                    className="w-16 h-16 mx-auto text-yellow-500"
                    aria-hidden="true"
                />

                <div className="space-y-2">
                    <h1 className="text-3xl font-afo">
                        Une erreur est survenue
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Nous n&apos;avons pas pu afficher cette page. Le
                        problème est probablement temporaire — réessayez dans un
                        instant.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <Button onClick={() => unstable_retry()}>
                        <IconRefresh className="w-4 h-4" aria-hidden="true" />
                        Réessayer
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/">Retour à l&apos;accueil</Link>
                    </Button>
                </div>

                {error.digest && (
                    <p className="text-xs text-muted-foreground/60">
                        Code d&apos;erreur : {error.digest}
                    </p>
                )}
            </div>
        </div>
    );
}
