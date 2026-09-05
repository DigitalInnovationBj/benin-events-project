"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { inviteAgent } from "@/actions/agent.actions";
import { toast } from "sonner";
import { IconUserPlus } from "@tabler/icons-react";

export default function AgentInviteForm({ eventId }: { eventId: string }) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        const result = await inviteAgent(eventId, email.trim());
        setLoading(false);

        if (result.error) {
            toast.error(result.error);
            return;
        }

        toast.success("Invitation envoyée !");
        setEmail("");
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-3">
            <Input
                type="email"
                placeholder="Email de l'utilisateur à inviter"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                required
            />
            <Button
                type="submit"
                disabled={loading}
                className="gap-2 shrink-0"
            >
                <IconUserPlus className="w-4 h-4" />
                {loading ? "Envoi..." : "Inviter"}
            </Button>
        </form>
    );
}
