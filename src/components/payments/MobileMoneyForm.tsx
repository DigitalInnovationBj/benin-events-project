"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { NETWORKS, type FeexpayNetwork } from "@/lib/feexpay-networks";

interface MobileMoneyFormProps {
    network: FeexpayNetwork | "";
    onNetworkChange: (network: FeexpayNetwork) => void;
    phoneNumber: string;
    onPhoneNumberChange: (value: string) => void;
    disabled?: boolean;
}

export function MobileMoneyForm({
    network,
    onNetworkChange,
    phoneNumber,
    onPhoneNumberChange,
    disabled,
}: MobileMoneyFormProps) {
    return (
        <div className="space-y-3">
            <div>
                <Label className="text-sm">
                    Opérateur Mobile Money <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                    {NETWORKS.map((n) => (
                        <button
                            key={n.slug}
                            type="button"
                            onClick={() => onNetworkChange(n.slug)}
                            disabled={disabled}
                            className={cn(
                                "h-10 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50",
                                network === n.slug
                                    ? "bg-secondary text-secondary-foreground border-secondary"
                                    : "bg-background hover:bg-muted",
                            )}
                        >
                            {n.label}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <Label htmlFor="mm-phone" className="text-sm">
                    Numéro Mobile Money <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="mm-phone"
                    type="tel"
                    placeholder="Ex : 90000000"
                    value={phoneNumber}
                    onChange={(e) => onPhoneNumberChange(e.target.value)}
                    disabled={disabled}
                    className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                    Vous recevrez une demande de confirmation directement sur ce numéro.
                </p>
            </div>
        </div>
    );
}
