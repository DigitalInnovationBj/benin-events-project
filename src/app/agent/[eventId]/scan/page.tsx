import { getCurrentUser } from "@/lib/permissions";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { QrScanner } from "@/components/agent/qr-scanner";
import { Calendar, MapPin, MonitorPlay } from "lucide-react";

export default async function AgentScanPage({
    params,
}: {
    params: Promise<{ eventId: string }>;
}) {
    const { eventId } = await params;
    const dbUser = await getCurrentUser();
    if (!dbUser) redirect(`/sign-in?redirect_url=/agent/${eventId}/scan`);

    const agent = await prisma.eventAgent.findUnique({
        where: { eventId_userId: { eventId, userId: dbUser.id } },
        include: { event: true },
    });

    if (!agent || agent.status !== "CONFIRMED") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
                <div className="bg-card border rounded-3xl shadow-sm p-10 w-full max-w-md text-center">
                    <p className="text-2xl font-bold mb-3">Accès refusé</p>
                    <p className="text-muted-foreground text-sm">
                        Vous n&apos;êtes pas agent confirmé pour cet évènement.
                    </p>
                </div>
            </div>
        );
    }

    const event = agent.event;

    return (
        <div className="min-h-screen bg-muted/30 px-4 py-10">
            <div className="max-w-lg mx-auto space-y-6">
                {/* Header */}
                <div className="bg-card border rounded-2xl p-5 shadow-sm">
                    <h1 className="font-bold text-xl mb-1">{event.title}</h1>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {new Date(event.startDate).toLocaleDateString(
                                "fr-FR",
                                {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                },
                            )}
                        </span>
                        {event.eventType === "IN_PERSON" && event.location && (
                            <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                {event.location}
                            </span>
                        )}
                        {event.eventType === "ONLINE" && (
                            <span className="flex items-center gap-1.5">
                                <MonitorPlay className="w-4 h-4" />
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
