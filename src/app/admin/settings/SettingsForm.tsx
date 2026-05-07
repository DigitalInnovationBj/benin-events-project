"use client";

import { useState, useTransition } from "react";
import { updateCommissionRate } from "@/actions/settings.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Percent } from "lucide-react";

export function SettingsForm({ currentRate }: { currentRate: number }) {
    const [rate, setRate] = useState(String(currentRate));
    const [isPending, startTransition] = useTransition();

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const parsed = parseFloat(rate);
        if (isNaN(parsed) || parsed < 0 || parsed > 100) {
            toast.error("Entrez un pourcentage entre 0 et 100");
            return;
        }
        startTransition(async () => {
            try {
                await updateCommissionRate(parsed);
                toast.success("Taux de commission mis à jour");
            } catch {
                toast.error("Une erreur est survenue");
            }
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
            <div className="space-y-2">
                <Label htmlFor="rate">Taux de commission organisateur</Label>
                <div className="relative">
                    <Input
                        id="rate"
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        className="pr-10"
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
                <p className="text-xs text-muted-foreground">
                    0% = gratuit pour les organisateurs. Ce taux s&apos;applique sur le montant brut des ventes de chaque organisateur lors du reversement.
                </p>
            </div>

            <div className="flex items-center gap-3">
                <Button type="submit" disabled={isPending} className="gap-2">
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Enregistrer
                </Button>
                {currentRate === 0 && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        Mode gratuit actif
                    </span>
                )}
                {currentRate > 0 && (
                    <span className="text-xs text-secondary bg-secondary/10 px-2 py-1 rounded-full font-semibold">
                        {currentRate}% appliqué
                    </span>
                )}
            </div>
        </form>
    );
}
