import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getScannableEvents } from "@/lib/scan-access";
import { Button } from "@/components/ui/button";
import { HelpCallout } from "@/components/dashboard/help-callout";
import { formatEventDateLong, formatEventTime } from "@/lib/format";
import {
    IconScan,
    IconCalendar,
    IconMapPin,
    IconDeviceTvOld,
    IconTicket,
} from "@tabler/icons-react";

export const metadata: Metadata = {
    title: "Contrôle d'accès",
    robots: { index: false, follow: false },
};

/**
 * Évènements que l'utilisateur peut contrôler à l'entrée.
 *
 * Les agents n'avaient aucun point d'entrée : ils recevaient un lien
 * d'invitation par email et devaient le retrouver pour scanner. Les
 * organisateurs, eux, n'avaient tout simplement pas accès au scanner.
 */
export default async function ScanIndexPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/sign-in?redirect_url=%2Fdashboard%2Fscan");

    const events = await getScannableEvents(user);

    return (
        <div className="max-w-3xl mx-auto w-full pb-20">
            <div className="mb-8">
                <h1 className="text-3xl font-afo mb-1">Contrôle d&apos;accès</h1>
                <p className="text-sm text-muted-foreground">
                    Scannez les billets à l&apos;entrée de vos évènements.
                </p>
            </div>

            <div className="mb-6">
            <HelpCallout guideAnchor="jour-j">
                Choisissez l&apos;évènement, autorisez la caméra puis visez le QR
                code. Un pass multi-jours passe une fois par jour.
            </HelpCallout>
            </div>

            {events.length === 0 ? (
                <div className="rounded-2xl border border-dashed py-20 text-center">
                    <IconScan
                        className="mx-auto mb-4 h-10 w-10 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <p className="mb-1 font-medium">
                        Aucun évènement à contrôler
                    </p>
                    <p className="mx-auto mb-6 max-w-sm text-sm text-muted-foreground">
                        Vous verrez ici les évènements que vous organisez, ainsi
                        que ceux pour lesquels un organisateur vous a désigné
                        comme agent.
                    </p>
                    <Button asChild variant="secondary">
                        <Link href="/events">Parcourir les évènements</Link>
                    </Button>
                </div>
            ) : (
                <ul className="space-y-3">
                    {events.map((event) => (
                        <li
                            key={event.id}
                            className="rounded-2xl border bg-card p-4 sm:p-5"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                        <Link
                                            href={`/events/${event.slug}`}
                                            className="font-bold underline-offset-2 hover:underline line-clamp-1"
                                        >
                                            {event.title}
                                        </Link>
                                        <span
                                            className={
                                                event.via === "organizer"
                                                    ? "shrink-0 rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-semibold text-secondary"
                                                    : "shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground"
                                            }
                                        >
                                            {event.via === "organizer"
                                                ? "Organisateur"
                                                : event.canScan && event.canSell
                                                  ? "Agent · Point de vente"
                                                  : event.canSell
                                                    ? "Point de vente"
                                                    : "Agent"}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4">
                                        <span className="flex items-center gap-1.5">
                                            <IconCalendar
                                                className="h-3.5 w-3.5 shrink-0"
                                                aria-hidden="true"
                                            />
                                            {formatEventDateLong(event.startDate)}{" "}
                                            à {formatEventTime(event.startDate)}
                                        </span>
                                        {event.eventType === "IN_PERSON" &&
                                        event.location ? (
                                            <span className="flex items-center gap-1.5">
                                                <IconMapPin
                                                    className="h-3.5 w-3.5 shrink-0"
                                                    aria-hidden="true"
                                                />
                                                <span className="truncate">
                                                    {event.location}
                                                </span>
                                            </span>
                                        ) : event.eventType === "ONLINE" ? (
                                            <span className="flex items-center gap-1.5">
                                                <IconDeviceTvOld
                                                    className="h-3.5 w-3.5 shrink-0"
                                                    aria-hidden="true"
                                                />
                                                En ligne
                                            </span>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="flex shrink-0 gap-2">
                                    {event.via === "organizer" && (
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Link
                                                href={`/dashboard/events/${event.id}`}
                                            >
                                                <IconTicket
                                                    className="h-4 w-4"
                                                    aria-hidden="true"
                                                />
                                                Gérer
                                            </Link>
                                        </Button>
                                    )}
                                    <Button asChild size="sm">
                                        <Link
                                            href={
                                                event.canScan
                                                    ? `/agent/${event.id}/scan`
                                                    : `/agent/${event.id}/scan?mode=vente`
                                            }
                                        >
                                            <IconScan
                                                className="h-4 w-4"
                                                aria-hidden="true"
                                            />
                                            Scanner
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
