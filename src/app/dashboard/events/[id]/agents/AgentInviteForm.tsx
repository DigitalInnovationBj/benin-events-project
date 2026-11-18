"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { inviteAgent } from "@/actions/agent.actions";
import { toast } from "sonner";
import { IconUserPlus } from "@tabler/icons-react";

export default function AgentInviteForm({ eventId }: { eventId: string }) {
    const [email, setEmail] = useState("");
    const [canScan, setCanScan] = useState(true);
    const [canSell, setCanSell] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email.trim()) return;
        if (!canScan && !canSell) {
            toast.error("Choisissez au moins un rôle.");
            return;
        }

        setLoading(true);
        const result = await inviteAgent(eventId, email.trim(), { canScan, canSell });
        setLoading(false);

        if (result.error) {
            toast.error(result.error);
            return;
        }

        toast.success("Invitation envoyée !");
        setEmail("");
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-3">
                <Input
                    type="email"
                    placeholder="Email de l'utilisateur à inviter"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                    required
                />
                <Button type="submit" disabled={loading} className="gap-2 shrink-0">
                    <IconUserPlus className="w-4 h-4" />
                    {loading ? "Envoi..." : "Inviter"}
                </Button>
            </div>
            <fieldset className="space-y-2">
                <legend className="mb-1 text-xs font-medium text-muted-foreground">Rôles</legend>
                <label className="flex items-start gap-2 text-sm">
                    <Checkbox checked={canScan} onCheckedChange={(v) => setCanScan(v === true)} className="mt-0.5" />
                    <span>
                        Contrôle d&apos;entrée
                        <span className="block text-xs text-muted-foreground">Scanne les billets à l&apos;entrée.</span>
                    </span>
                </label>
                <label className="flex items-start gap-2 text-sm">
                    <Checkbox checked={canSell} onCheckedChange={(v) => setCanSell(v === true)} className="mt-0.5" />
                    <span>
                        Point de vente
                        <span className="block text-xs text-muted-foreground">Active les billets imprimés qu&apos;il vend.</span>
                    </span>
                </label>
            </fieldset>
        </form>
    );
}
