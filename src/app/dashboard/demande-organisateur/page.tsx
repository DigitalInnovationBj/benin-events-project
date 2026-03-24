import { RequestOrganizerForm } from "@/components/forms/RequestOrganizerForm";
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DemandeOrganisateurPage() {
    const user = await currentUser();
    if (!user) redirect("/sign-in");

    const dbUser = await prisma.user.findUnique({
        where: { clerkId: user.id },
        include: { organizerRequests: true },
    });

    if (dbUser?.role === "ORGANIZER" || dbUser?.role === "ADMIN") {
        return (
            <div className="max-w-2xl mx-auto mt-10 p-6 bg-card rounded-lg text-center">
                <h1 className="text-2xl font-bold mb-4">
                    Vous êtes déjà Organisateur
                </h1>
                <p className="text-muted-foreground">
                    Vous avez déjà les permissions nécessaires pour créer des
                    évènements.
                </p>
            </div>
        );
    }

    const hasPendingRequest = dbUser?.organizerRequests?.some(
        (r) => r.status === "PENDING",
    );

    if (hasPendingRequest) {
        return (
            <div className="max-w-2xl mx-auto mt-10 p-6 bg-card rounded-lg text-center border border-primary/20 bg-primary/5">
                <h1 className="text-2xl font-bold mb-4 text-primary">
                    Demande en cours...
                </h1>
                <p className="text-muted-foreground">
                    Votre demande pour devenir organisateur est actuellement en
                    cours d'examen par nos administrateurs. Vous recevrez un
                    email dès qu'elle sera validée.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto w-full">
            <h1 className="text-3xl font-bold font-afo mb-2">
                Devenir Organisateur
            </h1>
            <p className="text-muted-foreground mb-8 text-sm">
                Remplissez ce formulaire pour obtenir les droits de création et
                de gestion d'évènements sur Benin Events.
            </p>

            <RequestOrganizerForm />
        </div>
    );
}
