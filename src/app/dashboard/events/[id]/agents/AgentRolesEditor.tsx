"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { setAgentRoles } from "@/actions/agent.actions";

/** Rôles d'un membre : contrôle d'entrée et point de vente. */
export default function AgentRolesEditor({
    eventId,
    userId,
    canScan,
    canSell,
}: {
    eventId: string;
    userId: string;
    canScan: boolean;
    canSell: boolean;
}) {
    const [roles, setRoles] = useState({ canScan, canSell });
    const [pending, startTransition] = useTransition();

    function toggle(key: "canScan" | "canSell", value: boolean) {
        const next = { ...roles, [key]: value };
        if (!next.canScan && !next.canSell) {
            toast.error("Gardez au moins un rôle, ou révoquez l'agent.");
            return;
        }
        const previous = roles;
        setRoles(next);
        startTransition(async () => {
            const res = await setAgentRoles(eventId, userId, next);
            if (res.error) {
                setRoles(previous);
                toast.error(res.error);
            }
        });
    }

    return (
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
            <label className="flex items-center gap-2">
                <Switch
                    checked={roles.canScan}
                    disabled={pending}
                    onCheckedChange={(v) => toggle("canScan", v)}
                    aria-label="Contrôle d'entrée"
                />
                Contrôle d&apos;entrée
            </label>
            <label className="flex items-center gap-2">
                <Switch
                    checked={roles.canSell}
                    disabled={pending}
                    onCheckedChange={(v) => toggle("canSell", v)}
                    aria-label="Point de vente"
                />
                Point de vente
            </label>
        </div>
    );
}
