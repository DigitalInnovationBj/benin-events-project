import { getAllPayoutRequests } from "@/actions/payout.actions";
import { PayoutActions } from "./PayoutActions";
import { BadgeCheck, Clock, XCircle, Loader } from "lucide-react";

const STATUS_CONFIG = {
    PENDING:    { label: "En attente",  color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
    PROCESSING: { label: "En cours",    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Loader },
    PAID:       { label: "Reversé",     color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: BadgeCheck },
    REJECTED:   { label: "Rejeté",      color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

export default async function AdminPayoutsPage() {
    const requests = await getAllPayoutRequests();
    const pending = requests.filter((r) => r.status === "PENDING" || r.status === "PROCESSING");
    const done = requests.filter((r) => r.status === "PAID" || r.status === "REJECTED");

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-afo mb-6">Reversements</h1>

            <div className="space-y-10">
                {/* ── À traiter ──────────────────────────────────────── */}
                <section>
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">
                        À traiter ({pending.length})
                    </h2>
                    {pending.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Aucune demande en attente.</p>
                    ) : (
                        <div className="grid gap-4">
                            {pending.map((req) => {
                                const cfg = STATUS_CONFIG[req.status];
                                const Icon = cfg.icon;
                                return (
                                    <div key={req.id} className="bg-card border rounded-xl p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                                                    <Icon className="w-3 h-3" />
                                                    {cfg.label}
                                                </span>
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
                </section>

                {/* ── Historique ─────────────────────────────────────── */}
                {done.length > 0 && (
                    <section>
                        <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-muted-foreground">
                            Historique ({done.length})
                        </h2>
                        <div className="grid gap-3 opacity-70">
                            {done.map((req) => {
                                const cfg = STATUS_CONFIG[req.status];
                                const Icon = cfg.icon;
                                return (
                                    <div key={req.id} className="bg-muted border rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                                        <div>
                                            <p className="font-semibold text-sm">{req.organizer.name} — {req.netAmount.toLocaleString("fr-FR")} FCFA net</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(req.createdAt).toLocaleDateString("fr-FR")}
                                                {req.adminNote && ` — ${req.adminNote}`}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${cfg.color}`}>
                                            <Icon className="w-3 h-3" />
                                            {cfg.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
