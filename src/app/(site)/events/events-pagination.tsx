"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface Props {
    currentPage: number;
    totalPages: number;
}

/**
 * Pagination de la liste d'évènements.
 *
 * Rend de vrais `<a>` (via `Link`) plutôt que des boutons : les pages restent
 * indexables, ouvrables dans un nouvel onglet et accessibles au clavier.
 */
export default function EventsPagination({ currentPage, totalPages }: Props) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    if (totalPages <= 1) return null;

    const hrefForPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        if (page <= 1) params.delete("page");
        else params.set("page", String(page));
        const qs = params.toString();
        return `${pathname}${qs ? `?${qs}` : ""}`;
    };

    // Fenêtre de pages autour de la page courante, bornes toujours visibles.
    const pages: (number | "gap")[] = [];
    const window = 1;
    for (let p = 1; p <= totalPages; p++) {
        const isEdge = p === 1 || p === totalPages;
        const isNear = Math.abs(p - currentPage) <= window;
        if (isEdge || isNear) {
            pages.push(p);
        } else if (pages[pages.length - 1] !== "gap") {
            pages.push("gap");
        }
    }

    const linkClass =
        "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm transition-colors hover:bg-accent hover:text-accent-foreground";

    return (
        <nav
            aria-label="Pagination des évènements"
            className="mt-12 flex items-center justify-center gap-1.5"
        >
            {currentPage > 1 ? (
                <Link
                    href={hrefForPage(currentPage - 1)}
                    className={linkClass}
                    rel="prev"
                    aria-label="Page précédente"
                >
                    <IconChevronLeft className="w-4 h-4" aria-hidden="true" />
                </Link>
            ) : (
                <span
                    className={cn(linkClass, "opacity-40 pointer-events-none")}
                    aria-hidden="true"
                >
                    <IconChevronLeft className="w-4 h-4" />
                </span>
            )}

            {pages.map((p, i) =>
                p === "gap" ? (
                    <span
                        key={`gap-${i}`}
                        className="px-1.5 text-muted-foreground"
                        aria-hidden="true"
                    >
                        …
                    </span>
                ) : (
                    <Link
                        key={p}
                        href={hrefForPage(p)}
                        className={cn(
                            linkClass,
                            p === currentPage &&
                                "bg-secondary text-secondary-foreground border-secondary font-semibold hover:bg-secondary",
                        )}
                        aria-label={`Page ${p}`}
                        aria-current={p === currentPage ? "page" : undefined}
                    >
                        {p}
                    </Link>
                ),
            )}

            {currentPage < totalPages ? (
                <Link
                    href={hrefForPage(currentPage + 1)}
                    className={linkClass}
                    rel="next"
                    aria-label="Page suivante"
                >
                    <IconChevronRight className="w-4 h-4" aria-hidden="true" />
                </Link>
            ) : (
                <span
                    className={cn(linkClass, "opacity-40 pointer-events-none")}
                    aria-hidden="true"
                >
                    <IconChevronRight className="w-4 h-4" />
                </span>
            )}
        </nav>
    );
}
