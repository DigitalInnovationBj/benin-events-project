import Link from "next/link";
import { IconCircle, IconCircleCheck, IconArrowRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import type { ChecklistStep } from "@/lib/organizer-stats";

/**
 * Checklist « Premiers pas » — bloc violet de la charte. Les étapes sont
 * cochées automatiquement d'après les données de l'organisateur.
 */
export function OnboardingChecklist({
    steps,
    showGuideLink = false,
}: {
    steps: ChecklistStep[];
    showGuideLink?: boolean;
}) {
    const done = steps.filter((s) => s.done).length;
    const percent = Math.round((done / steps.length) * 100);

    return (
        <section className="rounded-2xl bg-primary p-5 text-primary-foreground">
            <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Premiers pas</h2>
                <span className="text-sm text-secondary">
                    {done} sur {steps.length}
                </span>
            </div>
            <div
                className="mb-3 h-1.5 rounded-full bg-black/30"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progression de la prise en main"
            >
                <div
                    className="h-1.5 rounded-full bg-secondary transition-all"
                    style={{ width: `${percent}%` }}
                />
            </div>
            <ul>
                {steps.map((step) => (
                    <li
                        key={step.key}
                        className="flex items-center gap-3 border-t border-white/10 py-2.5 text-sm"
                    >
                        {step.done ? (
                            <IconCircleCheck className="size-5 shrink-0 text-secondary" aria-hidden="true" />
                        ) : (
                            <IconCircle className="size-5 shrink-0 text-primary-foreground/50" aria-hidden="true" />
                        )}
                        <span
                            className={
                                step.done
                                    ? "flex-1 text-primary-foreground/60 line-through"
                                    : "flex-1"
                            }
                        >
                            {step.label}
                            <span className="sr-only">
                                {step.done ? " (fait)" : " (à faire)"}
                            </span>
                        </span>
                        {!step.done && (
                            <Button asChild size="sm" variant="secondary" className="h-7 px-3">
                                <Link href={step.href}>{step.cta}</Link>
                            </Button>
                        )}
                    </li>
                ))}
            </ul>
            {showGuideLink && (
                <Link
                    href="/dashboard/guide"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-secondary"
                >
                    Ouvrir le guide <IconArrowRight className="size-4" aria-hidden="true" />
                </Link>
            )}
        </section>
    );
}
