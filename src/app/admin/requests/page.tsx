import prisma from "@/lib/prisma";
import { ServerActionButtons } from "./ServerActionButtons"; // Un composant client pour les boutons
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, requestStatusBadge } from "@/components/ui/status-badge";

export default async function AdminRequestsPage() {
    const requests = await prisma.organizerRequest.findMany({
        orderBy: { createdAt: "desc" },
        include: { user: true },
    });

    const pendingRequests = requests.filter((r) => r.status === "PENDING");
    const processedRequests = requests.filter((r) => r.status !== "PENDING");

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-afo mb-6">Demandes organisateurs</h1>

            <Tabs defaultValue="pending">
                <TabsList>
                    <TabsTrigger value="pending">
                        En attente ({pendingRequests.length})
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        Historique ({processedRequests.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                    {pendingRequests.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-8 text-center">
                            Aucune demande en attente.
                        </p>
                    ) : (
                        <div className="grid gap-4">
                            {pendingRequests.map((req) => (
                                <div
                                    key={req.id}
                                    className="bg-card border p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                                >
                                    <div>
                                        <h3 className="font-bold">
                                            {req.organizerName}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Utilisateur: {req.user.name} (
                                            {req.user.email})
                                        </p>
                                        <p className="text-sm">
                                            Tél: {req.phoneNumber} | Adresse:{" "}
                                            {req.address}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Email orga:{" "}
                                            {req.organizerEmail || req.user.email}
                                        </p>
                                        {req.description && (
                                            <p className="text-sm mt-2 italic text-muted-foreground">
                                                &quot;{req.description}&quot;
                                            </p>
                                        )}
                                    </div>
                                    <ServerActionButtons requestId={req.id} />
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history">
                    {processedRequests.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-8 text-center">
                            Aucune demande traitée pour le moment.
                        </p>
                    ) : (
                        <div className="grid gap-4">
                            {processedRequests.map((req) => {
                                const { tone, label, icon } = requestStatusBadge(req.status);
                                return (
                                    <div
                                        key={req.id}
                                        className="bg-muted/40 border p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                                    >
                                        <div>
                                            <h3 className="font-bold">
                                                {req.organizerName}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                Date :{" "}
                                                {new Date(
                                                    req.updatedAt,
                                                ).toLocaleDateString("fr-FR")}
                                            </p>
                                        </div>
                                        <StatusBadge tone={tone} label={label} icon={icon} />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
