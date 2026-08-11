"use client";

import { useState } from "react";
import { processPartnerRequest } from "@/actions/admin.actions";
import { toast } from "sonner";

export function PartnerActionButtons({ requestId }: { requestId: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [commissionRate, setCommissionRate] = useState("0");

    async function handleApprove() {
        const rate = Number(commissionRate);
        if (Number.isNaN(rate) || rate < 0 || rate > 100) {
            toast.error("Taux de commission invalide (0 à 100).");
            return;
        }
        setIsLoading(true);
        const result = await processPartnerRequest(requestId, "APPROVED", rate);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(result.message);
        }
        setIsLoading(false);
    }

    async function handleReject() {
        setIsLoading(true);
        const result = await processPartnerRequest(requestId, "REJECTED");
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(result.message);
        }
        setIsLoading(false);
    }

    return (
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div className="flex items-center gap-1.5">
                <input
                    type="number"
                    min={0}
                    max={100}
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    disabled={isLoading}
                    className="w-16 h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                    aria-label="Taux de commission (%)"
                />
                <span className="text-xs text-muted-foreground">%</span>
            </div>
            <button
                onClick={handleReject}
                disabled={isLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
                Refuser
            </button>
            <button
                onClick={handleApprove}
                disabled={isLoading}
                className="bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
                Approuver
            </button>
        </div>
    );
}
