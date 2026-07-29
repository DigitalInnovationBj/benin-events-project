import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default async function AgentConfirmPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    const { userId } = await auth();

    if (!userId) {
        redirect(`/sign-in?redirect_url=/agent/confirm/${token}`);
    }

    const agent = await prisma.eventAgent.findUnique({
        where: { token },
        include: {
            event: true,
            user: true,
        },
    });

    if (!agent) {
        return (
            <ConfirmLayout>
                <XCircle className="w-14 h-14 text-red-500 mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-center mb-3">
                    Lien invalide
                </h1>
                <p className="text-muted-foreground text-center mb-8">
                    Ce lien d&apos;invitation est invalide ou a expiré.
                </p>
                <Link href="/dashboard">
                    <Button className="w-full">Aller au tableau de bord</Button>
                </Link>
            </ConfirmLayout>
        );
    }

    if (agent.status === "REVOKED") {
        return (
            <ConfirmLayout>
                <XCircle className="w-14 h-14 text-red-500 mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-center mb-3">
                    Invitation révoquée
                </h1>
                <p className="text-muted-foreground text-center mb-8">
                    Cette invitation a été annulée par l&apos;organisateur.
                </p>
                <Link href="/dashboard">
                    <Button className="w-full">Aller au tableau de bord</Button>
                </Link>
            </ConfirmLayout>
        );
    }

    if (agent.status === "CONFIRMED") {
        return (
            <ConfirmLayout>
                <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-center mb-3">
                    Déjà confirmé
                </h1>
                <p className="text-muted-foreground text-center mb-2">
                    Vous êtes déjà agent pour
                </p>
                <p className="font-bold text-center text-lg mb-8">
                    {agent.event.title}
                </p>
                <Link href={`/agent/${agent.eventId}/scan`}>
                    <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                        Accéder au scanner
                    </Button>
                </Link>
            </ConfirmLayout>
        );
    }

    // PENDING — show confirm button that triggers the server action
    return (
        <ConfirmLayout>
            <AlertCircle className="w-14 h-14 text-yellow-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-center mb-3">
                Invitation agent
            </h1>
            <p className="text-muted-foreground text-center mb-2">
                Vous avez été invité à devenir agent pour
            </p>
            <p className="font-bold text-center text-xl mb-6">
                {agent.event.title}
            </p>
            <p className="text-sm text-center text-muted-foreground mb-8">
                En confirmant, vous pourrez scanner les QR codes des billets
                lors de l&apos;évènement.
            </p>
            <ConfirmButton token={token} />
        </ConfirmLayout>
    );
}

function ConfirmLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <div className="bg-card border rounded-3xl shadow-sm p-10 w-full max-w-md">
                {children}
            </div>
        </div>
    );
}

// Client component for the confirm button
import ConfirmButton from "./ConfirmButton";
