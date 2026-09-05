import { getCurrentUser } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconArrowLeft } from "@tabler/icons-react";
import { StatusBadge, agentStatusBadge } from "@/components/ui/status-badge";
import AgentInviteForm from "./AgentInviteForm";
import RevokeButton from "./RevokeButton";

export default async function EventAgentsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const caller = await getCurrentUser();
    if (!caller) redirect("/sign-in");

    if (caller.role !== "ORGANIZER" && caller.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            agents: {
                include: { user: true },
                orderBy: { createdAt: "asc" },
            },
        },
    });

    if (!event) redirect("/dashboard/events");
    if (caller.role !== "ADMIN" && event.organizerId !== caller.id) {
        redirect("/dashboard/events");
    }

    return (
        <div className="max-w-3xl mx-auto w-full pb-20">
            <div className="flex items-center justify-between mb-6">
                <Link href={`/dashboard/events/${id}`}>
                    <Button variant="ghost" size="sm" className="gap-2">
                        <IconArrowLeft className="w-4 h-4" /> Retour
                    </Button>
                </Link>
            </div>

            <h1 className="text-2xl font-bold mb-1">Agents de l&apos;évènement</h1>
            <p className="text-muted-foreground mb-8 text-sm">
                {event.title}
            </p>

            {/* Invite form */}
            <div className="bg-card border rounded-2xl p-6 mb-8 shadow-sm">
                <h2 className="font-bold text-lg mb-4">Inviter un agent</h2>
                <AgentInviteForm eventId={id} />
            </div>

            {/* Agents list */}
            <div className="bg-card border rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-lg mb-4">
                    Agents ({event.agents.length})
                </h2>

                {event.agents.length === 0 ? (
                    <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed">
                        <p className="text-muted-foreground text-sm">
                            Aucun agent invité pour cet évènement.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {event.agents.map((agent) => (
                            <div
                                key={agent.id}
                                className="flex items-center justify-between gap-4 border rounded-xl p-4"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate">
                                        {agent.user.name ?? agent.user.email}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {agent.user.email}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {(() => {
                                        const { tone, label, icon } = agentStatusBadge(agent.status);
                                        return <StatusBadge tone={tone} label={label} icon={icon} />;
                                    })()}

                                    {agent.status !== "REVOKED" && (
                                        <RevokeButton
                                            eventId={id}
                                            targetUserId={agent.userId}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
