import { getAllPayoutRequests } from "@/actions/payout.actions";
import { PayoutActions } from "./PayoutActions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, payoutStatusBadge } from "@/components/ui/status-badge";

export default async function AdminPayoutsPage() {
    const requests = await getAllPayoutRequests();
    const pending = requests.filter((r) => r.status === "PENDING" || r.status === "PROCESSING");
    const done = requests.filter((r) => r.status === "PAID" || r.status === "REJECTED");

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-afo mb-6">Reversements</h1>

            <Tabs defaultValue="pending">
                <TabsList>
                    <TabsTrigger value="pending">
                        À traiter ({pending.length})
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        Historique ({done.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                    {pending.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-8 text-center">
                            Aucune demande en attente.
                        </p>
                    ) : (
                        <div className="grid gap-4">
                            {pending.map((req) => {
                                const { tone, label, icon } = payoutStatusBadge(req.status);
                                return (
                                    <div key={req.id} className="bg-card border rounded-xl p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <StatusBadge tone={tone} label={label} icon={icon} />
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(req.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                                                </span>
                                            </div>
                                            <p className="font-bold text-lg">
                                                {req.netAmount.toLocaleString("fr-FR")} FCFA net
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Brut : {req.grossAmount.toLocaleString("fr-FR")} FCFA
                                                {req.commissionRate > 0 && ` — commission ${req.commissionRate}% (${req.commissionAmount.toLocaleString("fr-FR")} FCFA)`}
                                            </p>
                                            <p className="text-sm font-medium">
                                                {req.organizer.name} — {req.organizer.email}
                                            </p>
                                            <div className="text-sm text-muted-foreground space-y-0.5">
                                                {req.methodType === "MOBILE_MONEY" ? (
                                                    <>
                                                        <p>Mobile Money — <span className="font-semibold text-foreground">{req.operator}</span></p>
                                                        <p>Numéro : <span className="font-semibold text-foreground">{req.phoneNumber}</span></p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p>Virement — <span className="font-semibold text-foreground">{req.bankName}</span></p>
                                                        <p>Titulaire : {req.accountName}</p>
                                                        <p>RIB/IBAN : <span className="font-mono text-xs text-foreground">{req.iban}</span></p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <PayoutActions id={req.id} status={req.status} />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history">
                    {done.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-8 text-center">
                            Aucun reversement traité pour le moment.
                        </p>
                    ) : (
                        <div className="grid gap-3">
                            {done.map((req) => {
                                const { tone, label, icon } = payoutStatusBadge(req.status);
                                return (
                                    <div key={req.id} className="bg-muted/40 border rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                                        <div>
                                            <p className="font-semibold text-sm">{req.organizer.name} — {req.netAmount.toLocaleString("fr-FR")} FCFA net</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(req.createdAt).toLocaleDateString("fr-FR")}
                                                {req.adminNote && ` — ${req.adminNote}`}
                                            </p>
                                        </div>
                                        <StatusBadge tone={tone} label={label} icon={icon} className="shrink-0" />
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
