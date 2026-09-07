import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { canScanEvent } from "@/lib/scan-access";
import prisma from "@/lib/prisma";
import { QrScanner } from "@/components/agent/qr-scanner";
import { Button } from "@/components/ui/button";
import { formatEventDateLong } from "@/lib/format";
import {
    IconCalendar,
    IconMapPin,
    IconDeviceTvOld,
    IconArrowLeft,
} from "@tabler/icons-react";

export default async function AgentScanPage({
    params,
}: {
    params: Promise<{ eventId: string }>;
}) {
    const { eventId } = await params;
    const dbUser = await getCurrentUser();
    if (!dbUser) redirect(`/sign-in?redirect_url=/agent/${eventId}/scan`);

    // Même règle que POST /api/agent/validate-ticket : agent confirmé,
    // organisateur de l'évènement, ou admin.
    const allowed = await canScanEvent(dbUser, eventId);

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
        },
    });

    if (!event) redirect("/dashboard/scan");

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

                {/* Scanner */}
                <div className="bg-card border rounded-2xl p-6 shadow-sm">
                    <h2 className="font-bold text-lg mb-6 text-center">
                        Scanner les billets
                    </h2>
                    <QrScanner eventId={eventId} />
                </div>
            </div>
        </div>
    );
}
