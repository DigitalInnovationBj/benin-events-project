import prisma from "@/lib/prisma";
import { PartnerActionButtons } from "./PartnerActionButtons";

export default async function AdminPartnerRequestsPage() {
    const requests = await prisma.partnerRequest.findMany({
        orderBy: { createdAt: "desc" },
        include: { applicant: true },
    });

    const pendingRequests = requests.filter((r) => r.status === "PENDING");
    const processedRequests = requests.filter((r) => r.status !== "PENDING");

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-afo mb-6">Candidatures Partenaires</h1>

            <div className="space-y-8">
                <section>
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">
                        En attente ({pendingRequests.length})
                    </h2>
                    {pendingRequests.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            Aucune candidature en attente.
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
                                            {req.organizationName}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Utilisateur : {req.applicant.name} (
                                            {req.applicant.email})
                                        </p>
                                        <p className="text-sm">
                                            Secteur : {req.sector} | Évènements
                                            /an (est.) : {req.estimatedEventsPerYear}
                                        </p>
                                        {req.message && (
                                            <p className="text-sm mt-2 italic text-muted-foreground">
                                                &quot;{req.message}&quot;
                                            </p>
                                        )}
                                    </div>
                                    <PartnerActionButtons requestId={req.id} />
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-muted-foreground">
                        Historique ({processedRequests.length})
                    </h2>
                    <div className="opacity-70 grid gap-4">
                        {processedRequests.map((req) => (
                            <div
                                key={req.id}
                                className="bg-muted border p-4 rounded-lg flex flex-col md:flex-row justify-between gap-4"
                            >
                                <div>
                                    <h3 className="font-bold">
                                        {req.organizationName}
                                    </h3>
                                    <p className="text-sm">
                                        Date :{" "}
                                        {new Date(
                                            req.updatedAt,
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <span
                                        className={`py-1 rounded text-xs px-3 font-semibold ${req.status === "APPROVED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
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
