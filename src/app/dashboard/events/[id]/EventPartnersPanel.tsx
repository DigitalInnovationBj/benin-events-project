"use client";

import { useState, useTransition } from "react";
import type { DiscountType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    createEventPartner,
    toggleEventPartnerActive,
} from "@/actions/eventPartner.actions";
import { toast } from "sonner";
import { IconUsersGroup, IconTag, IconPlus } from "@tabler/icons-react";

interface PartnerRow {
    id: string;
    name: string;
    code: string;
    discountType: DiscountType;
    discountValue: number;
    isActive: boolean;
    salesCount: number;
    revenueGenerated: number;
    totalDiscountGiven: number;
}

interface EventPartnersPanelProps {
    eventId: string;
    initialPartners: PartnerRow[];
}

export function EventPartnersPanel({ eventId, initialPartners }: EventPartnersPanelProps) {
    const [partners, setPartners] = useState(initialPartners);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
    const [discountValue, setDiscountValue] = useState("");
    const [isPending, startTransition] = useTransition();

    function resetForm() {
        setName("");
        setCode("");
        setDiscountType("PERCENTAGE");
        setDiscountValue("");
        setShowForm(false);
    }

    function handleCreate() {
        const value = Number(discountValue);
        if (!name.trim() || !code.trim() || !value || value <= 0) {
            toast.error("Renseignez un nom, un code et une valeur de réduction valide.");
            return;
        }
        startTransition(async () => {
            const res = await createEventPartner({
                eventId,
                name: name.trim(),
                code: code.trim(),
                discountType,
                discountValue: value,
            });
            if (res.error) {
                toast.error(res.error);
                return;
            }
            toast.success("Partenaire ajouté !");
            setPartners((prev) => [
                {
                    id: crypto.randomUUID(),
                    name: name.trim(),
                    code: code.trim().toUpperCase(),
                    discountType,
                    discountValue: value,
                    isActive: true,
                    salesCount: 0,
                    revenueGenerated: 0,
                    totalDiscountGiven: 0,
                },
                ...prev,
            ]);
            resetForm();
        });
    }

    function handleToggle(partnerId: string, isActive: boolean) {
        setPartners((prev) =>
            prev.map((p) => (p.id === partnerId ? { ...p, isActive } : p)),
        );
        startTransition(async () => {
            const res = await toggleEventPartnerActive(partnerId, isActive);
            if (res.error) {
                toast.error(res.error);
                setPartners((prev) =>
                    prev.map((p) => (p.id === partnerId ? { ...p, isActive: !isActive } : p)),
                );
            }
        });
    }

    return (
        <div className="bg-card border rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-afo flex items-center gap-2">
                    <IconUsersGroup className="w-5 h-5 text-primary" stroke={1.75} />
                    Partenaires
                </h2>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setShowForm((v) => !v)}
                >
                    <IconPlus className="w-4 h-4" stroke={1.75} />
                    Ajouter
                </Button>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
                Associez un influenceur ou partenaire à un code promo pour cet
                évènement. La commission est à gérer directement avec lui, hors
                plateforme.
            </p>

            {showForm && (
                <div className="border rounded-xl p-4 space-y-3 mb-4 bg-muted/20">
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            placeholder="Nom du partenaire"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isPending}
                        />
                        <Input
                            placeholder="Code (ex: MARIE10)"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            disabled={isPending}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            value={discountType}
                            onValueChange={(v) => setDiscountType(v as "PERCENTAGE" | "FIXED")}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PERCENTAGE">Réduction en %</SelectItem>
                                <SelectItem value="FIXED">Montant fixe (FCFA)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            type="number"
                            min={1}
                            placeholder={discountType === "PERCENTAGE" ? "Ex : 10" : "Ex : 1000"}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            disabled={isPending}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={resetForm} disabled={isPending}>
                            Annuler
                        </Button>
                        <Button size="sm" onClick={handleCreate} disabled={isPending}>
                            Créer le code
                        </Button>
                    </div>
                </div>
            )}

            {partners.length === 0 ? (
                <div className="text-center py-8 bg-muted/30 rounded-2xl border border-dashed">
                    <p className="text-muted-foreground text-sm">
                        Aucun partenaire pour le moment.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {partners.map((p) => (
                        <div
                            key={p.id}
                            className="border rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm truncate">{p.name}</span>
                                    <span className="inline-flex items-center gap-1 text-xs bg-secondary/15 text-secondary font-mono font-medium px-2 py-0.5 rounded-md">
                                        <IconTag className="w-3 h-3" stroke={2} />
                                        {p.code}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {p.discountType === "PERCENTAGE"
                                        ? `-${p.discountValue}%`
                                        : `-${p.discountValue.toLocaleString("fr-FR")} FCFA`}
                                    {" · "}
                                    {p.salesCount} vente{p.salesCount !== 1 ? "s" : ""}
                                    {" · "}
                                    {p.revenueGenerated.toLocaleString("fr-FR")} FCFA générés
                                </p>
                            </div>
                            <Switch
                                checked={p.isActive}
                                onCheckedChange={(checked) => handleToggle(p.id, checked)}
                                disabled={isPending}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
