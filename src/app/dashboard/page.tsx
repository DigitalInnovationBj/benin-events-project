import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
    const user = await currentUser();
    if (!user) redirect("/sign-in");

    const dbUser = await prisma.user.findUnique({
        where: { clerkId: user.id },
    });

    return (
        <div className="max-w-6xl mx-auto w-full">
            <h1 className="text-3xl font-afo mb-2">
                Bonjour,{" "}
                {dbUser?.name ||
                    user.firstName ||
                    user.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
                    "Utilisateur"}{" "}
                👋
            </h1>
            <p className="text-muted-foreground mb-8">
                Bienvenue sur votre tableau de bord Benin Events.
            </p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Exemple de carte */}
                <div className="bg-card border rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold mb-2">Mes Billets</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        Retrouvez ici tous les billets que vous avez achetés.
                    </p>
                    <Button variant="outline" className="w-full">
                        Voir mes billets
                    </Button>
                </div>

                {dbUser?.role === "USER" && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-primary mb-2">
                            Devenir Organisateur
                        </h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            Vous souhaitez créer vos propres évènements sur la
                            plateforme ?
                        </p>
                        <Link href="/dashboard/demande-organisateur">
                            <Button className="w-full">
                                Faire une demande
                            </Button>
                        </Link>
                    </div>
                )}

                {(dbUser?.role === "ORGANIZER" || dbUser?.role === "ADMIN") && (
                    <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-secondary mb-2">
                            Mes Évènements
                        </h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            Gérez les évènements que vous organisez de A à Z.
                        </p>
                        <Link href="/dashboard/events">
                            <Button variant="secondary" className="w-full">
                                Gérer mes évènements
                            </Button>
                        </Link>
                    </div>
                )}

                {dbUser?.role === "ADMIN" && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-destructive mb-2">
                            Administration
                        </h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            Accédez au panneau d'administration pour valider les
                            demandes.
                        </p>
                        <Link href="/admin/requests">
                            <Button variant="destructive" className="w-full">
                                Panneau Admin
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
