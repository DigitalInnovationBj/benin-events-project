import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getEventRoles } from "@/lib/scan-access";
import prisma from "@/lib/prisma";
import { QrScanner, type ScanMode } from "@/components/agent/qr-scanner";
import { ScanModeSwitch } from "@/components/agent/scan-mode-switch";
import { Button } from "@/components/ui/button";
import { formatEventDateLong } from "@/lib/format";
import { formatDayKey } from "@/lib/ticket-days";
import {
    IconCalendar,
    IconMapPin,
    IconDeviceTvOld,
    IconArrowLeft,
} from "@tabler/icons-react";

export default async function AgentScanPage({
    params,
    searchParams,
}: {
    params: Promise<{ eventId: string }>;
    searchParams: Promise<{ point?: string; mode?: string }>;
}) {
    const [{ eventId }, { point, mode: modeParam }] = await Promise.all([params, searchParams]);
    const dbUser = await getCurrentUser();
    if (!dbUser) redirect(`/sign-in?redirect_url=/agent/${eventId}/scan`);

    // Mêmes règles que les API : contrôle d'entrée (validate-ticket) et
    // vente en point de vente (activate-ticket).
    const roles = await getEventRoles(dbUser, eventId);
    const allowed = roles.canScan || roles.canSell;
    const mode: ScanMode =
        !roles.canScan || (modeParam === "vente" && roles.canSell) ? "vente" : "entree";

    if (!allowed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
                <div className="bg-card border rounded-3xl shadow-sm p-10 w-full max-w-md text-center space-y-5">
                    <div>
                        <p className="text-2xl font-bold mb-3">Accès refusé</p>
                        <p className="text-muted-foreground text-sm">
                            Vous n&apos;êtes pas autorisé à scanner les billets
                            de cet évènement.
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/dashboard/scan">
                            Voir mes évènements à contrôler
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
            title: true,
            startDate: true,
            location: true,
            eventType: true,
            sessions: {
                select: { id: true, name: true, day: true },
                orderBy: [{ day: "asc" }, { createdAt: "asc" }],
            },
        },
    });

    if (!event) redirect("/dashboard/scan");

    // Point de contrôle choisi : entrée générale ou une session de l'évènement.
    const activeSession =
        mode === "entree" ? (event.sessions.find((s) => s.id === point) ?? null) : null;

    return (
        <div className="min-h-screen bg-muted/30 px-4 py-6 sm:py-10">
            <div className="max-w-lg mx-auto space-y-5">
                <Button asChild variant="ghost" size="sm" className="-ml-2">
                    <Link href="/dashboard/scan">
                        <IconArrowLeft className="w-4 h-4" aria-hidden="true" />
                        Mes évènements
                    </Link>
                </Button>

                {/* En-tête */}
                <div className="bg-card border rounded-2xl p-5 shadow-sm">
                    <h1 className="font-bold text-xl mb-1">{event.title}</h1>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <IconCalendar
                                className="w-4 h-4 shrink-0"
                                aria-hidden="true"
                            />
                            {formatEventDateLong(event.startDate)}
                        </span>
                        {event.eventType === "IN_PERSON" && event.location && (
                            <span className="flex items-center gap-1.5">
                                <IconMapPin
                                    className="w-4 h-4 shrink-0"
                                    aria-hidden="true"
                                />
                                {event.location}
                            </span>
                        )}
                        {event.eventType === "ONLINE" && (
                            <span className="flex items-center gap-1.5">
                                <IconDeviceTvOld
                                    className="w-4 h-4 shrink-0"
                                    aria-hidden="true"
                                />
                                En ligne
                            </span>
                        )}
                    </div>
                </div>

                <Suspense fallback={null}>
                    <ScanModeSwitch
                        eventId={eventId}
                        mode={mode}
                        showSwitch={roles.canScan && roles.canSell}
                    />
                </Suspense>

                {mode === "vente" && (
                    <div className="rounded-2xl border border-secondary/40 bg-secondary/10 p-4 text-sm">
                        <p className="font-semibold">Mode vente</p>
                        <p className="mt-1 text-muted-foreground">
                            Scannez le QR du billet au moment où vous le remettez à
                            l&apos;acheteur : il devient valable à l&apos;entrée et la
                            vente vous est attribuée.
                        </p>
                    </div>
                )}

                {/* Point de contrôle */}
                {mode === "entree" && event.sessions.length > 0 && (
                    <nav
                        aria-label="Point de contrôle"
                        className="bg-card border rounded-2xl p-4 shadow-sm space-y-2"
                    >
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Point de contrôle
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href={`/agent/${eventId}/scan`}
                                aria-current={!activeSession ? "page" : undefined}
                                className={!activeSession
                                    ? "rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground"
                                    : "rounded-full border px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground"}
                            >
                                Entrée générale
                            </Link>
                            {event.sessions.map((s) => (
                                <Link
                                    key={s.id}
                                    href={`/agent/${eventId}/scan?point=${s.id}`}
                                    aria-current={activeSession?.id === s.id ? "page" : undefined}
                                    className={activeSession?.id === s.id
                                        ? "rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground"
                                        : "rounded-full border px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground"}
                                >
                                    {s.name} · {formatDayKey(s.day)}
                                </Link>
                            ))}
                        </div>
                    </nav>
                )}

                {/* Scanner */}
                <div className="bg-card border rounded-2xl p-6 shadow-sm">
                    <h2 className="font-bold text-lg mb-6 text-center">
                        {mode === "vente"
                            ? "Activer un billet vendu"
                            : activeSession
                              ? `Scanner · ${activeSession.name}`
                              : "Scanner les billets"}
                    </h2>
                    {/* key : le scanner repart de zéro quand on change de point ou de mode */}
                    <QrScanner
                        key={`${mode}-${activeSession?.id ?? "main"}`}
                        eventId={eventId}
                        sessionId={activeSession?.id}
                        mode={mode}
                    />
                </div>
            </div>
        </div>
    );
}
