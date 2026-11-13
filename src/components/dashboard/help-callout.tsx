import Link from "next/link";
import type { ReactNode } from "react";
import { IconBulb } from "@tabler/icons-react";

/**
 * Encadré d'aide contextuel : explique l'action de la section en une ou deux
 * phrases et renvoie vers la fiche correspondante du guide.
 */
export function HelpCallout({
    children,
    guideAnchor,
}: {
    children: ReactNode;
    /** Ancre de la fiche du guide (ex. « billets »). */
    guideAnchor?: string;
}) {
    return (
        <div className="flex gap-3 rounded-2xl border border-primary/60 bg-primary/15 p-4 text-sm dark:bg-primary/30">
            <IconBulb className="size-5 shrink-0 text-secondary" aria-hidden="true" />
            <p className="text-foreground/90 leading-relaxed">
                {children}
                {guideAnchor && (
                    <>
                        {" "}
                        <Link
                            href={`/dashboard/guide#${guideAnchor}`}
                            className="font-medium text-secondary underline underline-offset-2"
                        >
                            Voir le guide
                        </Link>
                    </>
                )}
            </p>
        </div>
    );
}
