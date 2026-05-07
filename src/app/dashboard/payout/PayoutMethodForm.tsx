"use client";

import { useState, useTransition } from "react";
import { savePayoutMethod } from "@/actions/payout.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { PayoutMethod } from "@prisma/client";

type Tab = "MOBILE_MONEY" | "BANK_TRANSFER";

export function PayoutMethodForm({ method }: { method: PayoutMethod | null }) {
    const [tab, setTab] = useState<Tab>((method?.type as Tab) ?? "MOBILE_MONEY");
    const [isPending, startTransition] = useTransition();

    // Mobile Money
    const [operator, setOperator] = useState<"MTN" | "MOOV">((method?.operator as "MTN" | "MOOV") ?? "MTN");
    const [phone, setPhone] = useState(method?.phoneNumber ?? "");

    // Bank
    const [bankName, setBankName] = useState(method?.bankName ?? "");
    const [accountName, setAccountName] = useState(method?.accountName ?? "");
    const [iban, setIban] = useState(method?.iban ?? "");

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        startTransition(async () => {
            try {
                if (tab === "MOBILE_MONEY") {
                    if (!phone.trim()) { toast.error("Numéro requis"); return; }
                    await savePayoutMethod({ type: "MOBILE_MONEY", operator, phoneNumber: phone.trim() });
                } else {
                    if (!bankName.trim() || !accountName.trim() || !iban.trim()) {
                        toast.error("Tous les champs bancaires sont requis"); return;
                    }
                    await savePayoutMethod({ type: "BANK_TRANSFER", bankName: bankName.trim(), accountName: accountName.trim(), iban: iban.trim() });
                }
                toast.success("Coordonnées enregistrées");
            } catch {
                toast.error("Une erreur est survenue");
            }
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-muted rounded-xl w-fit">
                {(["MOBILE_MONEY", "BANK_TRANSFER"] as Tab[]).map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {t === "MOBILE_MONEY" ? "Mobile Money" : "Virement bancaire"}
                    </button>
                ))}
            </div>

            {tab === "MOBILE_MONEY" ? (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Opérateur</Label>
                        <div className="flex gap-2">
                            {(["MTN", "MOOV"] as const).map((op) => (
                                <button
                                    key={op}
                                    type="button"
                                    onClick={() => setOperator(op)}
                                    className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                                        operator === op
                                            ? "border-secondary bg-secondary/10 text-secondary"
                                            : "border-border text-muted-foreground hover:border-foreground"
                                    }`}
                                >
                                    {op === "MTN" ? "MTN MoMo" : "Moov Money"}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Numéro de téléphone</Label>
                        <Input
                            id="phone"
                            placeholder="Ex: 97000000"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label htmlFor="bankName">Nom de la banque</Label>
                        <Input id="bankName" placeholder="Ex: Ecobank, BOA" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="accountName">Nom du titulaire</Label>
                        <Input id="accountName" placeholder="Nom complet du titulaire" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="iban">RIB / IBAN</Label>
                        <Input id="iban" placeholder="BJ..." value={iban} onChange={(e) => setIban(e.target.value)} />
                    </div>
                </div>
            )}

            <Button type="submit" disabled={isPending} className="gap-2">
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Enregistrer
            </Button>
        </form>
    );
}
