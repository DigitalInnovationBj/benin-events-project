"use client";

import { useState } from "react";
import { processOrganizerRequest } from "@/actions/admin.actions";
import { toast } from "sonner";

export function ServerActionButtons({ requestId }: { requestId: string }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleAction = async (status: "APPROVED" | "REJECTED") => {
        setIsLoading(true);
        const result = await processOrganizerRequest(requestId, status);
        
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(result.message);
        }
        setIsLoading(false);
    };

    return (
        <div className="flex gap-2 shrink-0">
            <button
                onClick={() => handleAction("REJECTED")}
                disabled={isLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
                Refuser
            </button>
            <button
                onClick={() => handleAction("APPROVED")}
                disabled={isLoading}
                className="bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
                Approuver
            </button>
        </div>
    );
}
