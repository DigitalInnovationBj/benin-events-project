import { getPayoutSummary, getPayoutMethod, getMyPayoutRequests } from "@/actions/payout.actions";
import { PayoutMethodForm } from "./PayoutMethodForm";
import { RequestPayoutButton } from "./RequestPayoutButton";
import { StatusBadge, payoutStatusBadge } from "@/components/ui/status-badge";

export default async function PayoutPage() {
    const [summary, method, requests] = await Promise.all([
        getPayoutSummary(),
        getPayoutMethod(),
        getMyPayoutRequests(),
    ]);

    const hasPendingRequest = requests.some((r) => r.status === "PENDING" || r.status === "PROCESSING");

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-afo mb-1">Reversements</h1>
                <p className="text-muted-foreground text-sm">
                    Gérez vos reversements et coordonnées de paiement.
                </p>
            </div>

            {/* ── Solde ─────────────────────────────────────────────── */}
            <div className="bg-card border rounded-xl p-6 space-y-4">
                <h2 className="font-semibold text-lg">Solde disponible</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-muted/40 rounded-xl p-4">
                        <p className="text-xs text-muted-foreground mb-1">Revenus bruts</p>
                        <p className="text-xl font-bold">{summary.totalGross.toLocaleString("fr-FR")} <span className="text-sm font-normal text-muted-foreground">FCFA</span></p>
                    </div>
                    <div className="bg-muted/40 rounded-xl p-4">
                        <p className="text-xs text-muted-foreground mb-1">Déjà demandé</p>
                        <p className="text-xl font-bold">{summary.alreadyRequested.toLocaleString("fr-FR")} <span className="text-sm font-normal text-muted-foreground">FCFA</span></p>
                    </div>
                    <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-4 col-span-2 sm:col-span-1">
                        <p className="text-xs text-secondary mb-1">Net disponible</p>
                        <p className="text-xl font-bold text-secondary">{summary.netAvailable.toLocaleString("fr-FR")} <span className="text-sm font-normal">FCFA</span></p>
                        {summary.commissionRate > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Après {summary.commissionRate}% de commission ({summary.commissionAmount.toLocaleString("fr-FR")} FCFA)
                            </p>
                        )}
                        {summary.commissionRate === 0 && (
                            <p className="text-xs text-muted-foreground mt-1">0% de commission (offert)</p>
                        )}
                    </div>
                </div>

                <div className="pt-2">
                    {!method && (
                        <p className="text-sm text-muted-foreground mb-3">
                            Ajoutez vos coordonnées de paiement ci-dessous avant de demander un reversement.
                        </p>
                    )}
                    {hasPendingRequest && (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-3">
                            Une demande est déjà en cours de traitement.
                        </p>
                    )}
                    <RequestPayoutButton
                        disabled={!method || hasPendingRequest}
                        netAmount={summary.netAvailable}
                    />
                </div>
            </div>

            {/* ── Coordonnées de paiement ────────────────────────────── */}
            <div className="bg-card border rounded-xl p-6">
                <h2 className="font-semibold text-lg mb-1">Coordonnées de paiement</h2>
                <p className="text-sm text-muted-foreground mb-5">
                    Ces informations seront utilisées pour vous reverser vos fonds.
                </p>
                <PayoutMethodForm method={method} />
            </div>

            {/* ── Historique ────────────────────────────────────────── */}
            {requests.length > 0 && (
                <div className="bg-card border rounded-xl p-6">
                    <h2 className="font-semibold text-lg mb-4">Historique des demandes</h2>
                    <div className="space-y-3">
                        {requests.map((req) => {
                            const { tone, label, icon } = payoutStatusBadge(req.status);
                            return (
                                <div key={req.id} className="flex items-start justify-between gap-4 rounded-xl border p-4">
                                    <div className="space-y-1">
                                        <p className="font-semibold text-sm">
                                            {req.netAmount.toLocaleString("fr-FR")} FCFA net
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Brut : {req.grossAmount.toLocaleString("fr-FR")} FCFA
                                            {req.commissionRate > 0 && ` — commission ${req.commissionRate}%`}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {req.methodType === "MOBILE_MONEY"
                                                ? `${req.operator} — ${req.phoneNumber}`
                                                : `${req.bankName} — ${req.accountName}`}
                                        </p>
                                        {req.adminNote && (
                                            <p className="text-xs text-destructive mt-1">Note : {req.adminNote}</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <StatusBadge tone={tone} label={label} icon={icon} />
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(req.createdAt).toLocaleDateString("fr-FR")}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
