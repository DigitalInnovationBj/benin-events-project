import prisma from "@/lib/prisma";
import { ServerActionButtons } from "./ServerActionButtons"; // Un composant client pour les boutons

export default async function AdminRequestsPage() {
    const requests = await prisma.organizerRequest.findMany({
        orderBy: { createdAt: "desc" },
        include: { user: true },
    });

    const pendingRequests = requests.filter((r) => r.status === "PENDING");
    const processedRequests = requests.filter((r) => r.status !== "PENDING");

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold font-afo mb-6">
                Demandes Organisateurs
            </h1>

            <div className="space-y-8">
                <section>
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">
                        En attente ({pendingRequests.length})
                    </h2>
                    {pendingRequests.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            Aucune demande en attente.
                        </p>
                    ) : (
                        <div className="grid gap-4">
                            {pendingRequests.map((req) => (
                                <div
                                    key={req.id}
                                    className="bg-card border p-4 rounded-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
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
                                        {req.description && (
                                            <p className="text-sm mt-2 italic text-muted-foreground">
                                                "{req.description}"
                                            </p>
                                        )}
                                    </div>
                                    <ServerActionButtons requestId={req.id} />
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-muted-foreground">
                        Historique des demandes ({processedRequests.length})
                    </h2>
                    <div className="opacity-70 grid gap-4">
                        {processedRequests.map((req) => (
                            <div
                                key={req.id}
                                className="bg-muted border p-4 rounded-lg flex flex-col md:flex-row justify-between gap-4"
                            >
                                <div>
                                    <h3 className="font-bold">
                                        {req.organizerName}
                                    </h3>
                                    <p className="text-sm">
                                        Date:{" "}
                                        {new Date(
                                            req.updatedAt,
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <span
                                        className={`px-2 py-1 rounded text-xs px-3 font-semibold ${req.status === "APPROVED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                                    >
                                        {req.status === "APPROVED"
                                            ? "Approuvée"
                                            : "Rejetée"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
