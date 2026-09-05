"use client";

import { useState, useTransition } from "react";
import { updateCommissionRate, updatePlatformFees } from "@/actions/settings.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { IconLoader2, IconPercentage, IconCoins } from "@tabler/icons-react";

interface Props {
    currentRate: number;
    eventCreationFeeEnabled: boolean;
    eventCreationFee: number;
    featuredEventFeeEnabled: boolean;
    featuredEventFee: number;
}

export function SettingsForm({
    currentRate,
    eventCreationFeeEnabled,
    eventCreationFee,
    featuredEventFeeEnabled,
    featuredEventFee,
}: Props) {
    const [rate, setRate] = useState(String(currentRate));
    const [isPendingRate, startTransitionRate] = useTransition();

    const [creationEnabled, setCreationEnabled] = useState(eventCreationFeeEnabled);
    const [creationFee, setCreationFee] = useState(String(eventCreationFee));
    const [featuredEnabled, setFeaturedEnabled] = useState(featuredEventFeeEnabled);
    const [featuredFee, setFeaturedFee] = useState(String(featuredEventFee));
    const [isPendingFees, startTransitionFees] = useTransition();

    function handleRateSubmit(e: React.FormEvent) {
        e.preventDefault();
        const parsed = parseFloat(rate);
        if (isNaN(parsed) || parsed < 0 || parsed > 100) {
            toast.error("Entrez un pourcentage entre 0 et 100");
            return;
        }
        startTransitionRate(async () => {
            try {
                await updateCommissionRate(parsed);
                toast.success("Taux de commission mis à jour");
            } catch {
                toast.error("Une erreur est survenue");
            }
        });
    }

    function handleFeesSubmit(e: React.FormEvent) {
        e.preventDefault();
        const creation = parseFloat(creationFee);
        const featured = parseFloat(featuredFee);
        if (isNaN(creation) || creation < 0) {
            toast.error("Montant de création invalide");
            return;
        }
        if (isNaN(featured) || featured < 0) {
            toast.error("Montant de mise en vedette invalide");
            return;
        }
        startTransitionFees(async () => {
            try {
                await updatePlatformFees({
                    eventCreationFeeEnabled: creationEnabled,
                    eventCreationFee: creation,
                    featuredEventFeeEnabled: featuredEnabled,
                    featuredEventFee: featured,
                });
                toast.success("Frais de publication mis à jour");
            } catch {
                toast.error("Une erreur est survenue");
            }
        });
    }

    return (
        <div className="space-y-8">
            {/* ── Commission organisateurs ─────────────────────── */}
            <form onSubmit={handleRateSubmit} className="space-y-4 max-w-sm">
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
                        <IconPercentage className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        0% = gratuit pour les organisateurs. Ce taux s&apos;applique sur le montant brut des ventes de chaque organisateur lors du reversement.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button type="submit" disabled={isPendingRate} className="gap-2">
                        {isPendingRate && <IconLoader2 className="w-4 h-4 animate-spin" />}
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

            {/* ── Frais de publication ──────────────────────────── */}
            <form onSubmit={handleFeesSubmit} className="space-y-5 max-w-sm border-t pt-6">
                <div className="flex items-center gap-2 mb-1">
                    <IconCoins className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-semibold text-base">Frais de publication</h3>
                </div>

                {/* Création d'évènement */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="creation-toggle" className="font-medium">
                                Création d&apos;évènement payante
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                L&apos;organisateur doit payer pour publier un évènement.
                            </p>
                        </div>
                        <Switch
                            id="creation-toggle"
                            checked={creationEnabled}
                            onCheckedChange={setCreationEnabled}
                        />
                    </div>
                    {creationEnabled && (
                        <div className="space-y-1">
                            <Label htmlFor="creation-fee" className="text-sm">Montant (FCFA)</Label>
                            <div className="relative">
                                <Input
                                    id="creation-fee"
                                    type="number"
                                    min={0}
                                    step={100}
                                    value={creationFee}
                                    onChange={(e) => setCreationFee(e.target.value)}
                                    className="pr-16"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                                    FCFA
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mise en vedette */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="featured-toggle" className="font-medium">
                                Mise en vedette payante
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                L&apos;organisateur peut payer pour mettre en avant son évènement.
                            </p>
                        </div>
                        <Switch
                            id="featured-toggle"
                            checked={featuredEnabled}
                            onCheckedChange={setFeaturedEnabled}
                        />
                    </div>
                    {featuredEnabled && (
                        <div className="space-y-1">
                            <Label htmlFor="featured-fee" className="text-sm">Montant (FCFA)</Label>
                            <div className="relative">
                                <Input
                                    id="featured-fee"
                                    type="number"
                                    min={0}
                                    step={100}
                                    value={featuredFee}
                                    onChange={(e) => setFeaturedFee(e.target.value)}
                                    className="pr-16"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                                    FCFA
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <Button type="submit" disabled={isPendingFees} className="gap-2">
                    {isPendingFees && <IconLoader2 className="w-4 h-4 animate-spin" />}
                    Enregistrer les frais
                </Button>
            </form>
        </div>
    );
}
