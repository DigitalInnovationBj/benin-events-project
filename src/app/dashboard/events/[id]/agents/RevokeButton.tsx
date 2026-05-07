"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { revokeAgent } from "@/actions/agent.actions";
import { toast } from "sonner";
import { UserX } from "lucide-react";

export default function RevokeButton({
    eventId,
    targetUserId,
}: {
    eventId: string;
    targetUserId: string;
}) {
    const [loading, setLoading] = useState(false);

    async function handleRevoke() {
        if (!confirm("Révoquer cet agent ?")) return;
        setLoading(true);
        const result = await revokeAgent(eventId, targetUserId);
        setLoading(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Agent révoqué");
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-1.5"
            onClick={handleRevoke}
            disabled={loading}
        >
            <UserX className="w-4 h-4" />
            Révoquer
        </Button>
    );
}
