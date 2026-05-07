"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { confirmAgent } from "@/actions/agent.actions";
import { toast } from "sonner";

export default function ConfirmButton({ token }: { token: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleConfirm() {
        setLoading(true);
        const result = await confirmAgent(token);
        setLoading(false);

        if (result.error) {
            toast.error(result.error);
            return;
        }

        toast.success("Participation confirmée !");
        if (result.eventId) {
            router.push(`/agent/${result.eventId}/scan`);
        } else {
            router.push("/dashboard");
        }
    }

    return (
        <Button
            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold"
            onClick={handleConfirm}
            disabled={loading}
        >
            {loading ? "Confirmation..." : "Confirmer ma participation"}
        </Button>
    );
}
