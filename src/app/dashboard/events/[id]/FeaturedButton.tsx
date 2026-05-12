"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, Loader2 } from "lucide-react";
import { initiateFeaturedEventPayment } from "@/actions/platform.actions";
import { toast } from "sonner";

export function FeaturedButton({ eventId, fee }: { eventId: string; fee: number }) {
    const [isLoading, setIsLoading] = useState(false);

    async function handleClick() {
        setIsLoading(true);
        const res = await initiateFeaturedEventPayment(eventId);
        if (res.error) {
            toast.error(res.error);
            setIsLoading(false);
            return;
        }
        if (res.redirectUrl) {
            toast.success("Redirection vers le paiement…");
            window.location.href = res.redirectUrl;
        }
    }

    return (
        <Button onClick={handleClick} disabled={isLoading} variant="outline" size="sm" className="gap-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
            Mettre en vedette ({fee.toLocaleString("fr-FR")} FCFA)
        </Button>
    );
}
