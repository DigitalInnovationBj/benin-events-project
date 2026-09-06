"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
    COUNTRIES,
    DEFAULT_COUNTRY_CODE,
    getNetwork,
    getNetworksByCountry,
    isValidCountryCode,
    type FeexpayNetwork,
} from "@/lib/feexpay-networks";

interface MobileMoneyFormProps {
    network: FeexpayNetwork | "";
    onNetworkChange: (network: FeexpayNetwork | "") => void;
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
    const currentNetwork = network ? getNetwork(network) : undefined;
    const [countryCode, setCountryCode] = useState(
        currentNetwork?.countryCode ?? DEFAULT_COUNTRY_CODE,
    );

    const networksForCountry = useMemo(() => getNetworksByCountry(countryCode), [countryCode]);

    function handleCountryChange(nextCountry: string) {
        if (!isValidCountryCode(nextCountry)) return;
        setCountryCode(nextCountry);
        onNetworkChange(""); // le réseau sélectionné ne correspond plus au nouveau pays
    }

    return (
        <div className="space-y-3">
            <div>
                <Label className="text-sm">Pays</Label>
                <Select value={countryCode} onValueChange={handleCountryChange} disabled={disabled}>
                    <SelectTrigger className="mt-1.5">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {COUNTRIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                                {c.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label className="text-sm">
                    Opérateur Mobile Money <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                    {networksForCountry.map((n) => (
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
                    placeholder={countryCode === "BJ" ? "Ex : 0190000000" : "Ex : 90000000"}
                    value={phoneNumber}
                    onChange={(e) => onPhoneNumberChange(e.target.value)}
                    disabled={disabled}
                    className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                    {countryCode === "BJ"
                        ? "Nouveau format à 10 chiffres (ex : 01 90 00 00 00). "
                        : ""}
                    Vous recevrez une demande de confirmation directement sur ce numéro.
                </p>
            </div>
        </div>
    );
}
