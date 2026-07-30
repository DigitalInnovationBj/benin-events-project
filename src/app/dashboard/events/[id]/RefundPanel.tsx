"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { markOrderRefunded } from "@/actions/payment.actions";
import { toast } from "sonner";

export interface RefundableOrder {
    id: string;
    reference: string;
    totalAmount: number;
    status: "COMPLETED" | "REFUNDED";
    buyerName: string;
    buyerEmail: string;
}

export default function RefundPanel({ orders }: { orders: RefundableOrder[] }) {
    const [isPending, startTransition] = useTransition();
    const [processingId, setProcessingId] = useState<string | null>(null);

    if (orders.length === 0) return null;

    const pendingCount = orders.filter((o) => o.status === "COMPLETED").length;

    const handleMarkRefunded = (orderId: string) => {
        setProcessingId(orderId);
        startTransition(async () => {
            const res = await markOrderRefunded(orderId);
            setProcessingId(null);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Commande marquée comme remboursée.");
            }
        });
    };

    return (
        <div className="bg-card border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Remboursements</h3>
                {pendingCount > 0 && (
                    <Badge variant="destructive">{pendingCount} en attente</Badge>
                )}
            </div>
            <p className="text-sm text-muted-foreground">
                GeniusPay ne propose pas de remboursement automatique : traitez
                le virement ou le retour mobile money vous-même, puis marquez
                la commande comme remboursée ci-dessous pour informer
                l&apos;acheteur.
            </p>
            <div className="divide-y">
                {orders.map((order) => (
                    <div
                        key={order.id}
                        className="py-3 flex items-center justify-between gap-3"
                    >
                        <div className="min-w-0">
                            <p className="font-medium truncate">
                                {order.buyerName}{" "}
                                <span className="text-muted-foreground font-normal">
                                    ({order.buyerEmail})
                                </span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {order.reference} —{" "}
                                {order.totalAmount.toLocaleString("fr-FR")} FCFA
                            </p>
                        </div>
                        {order.status === "REFUNDED" ? (
                            <Badge variant="secondary" className="gap-1 shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Remboursé
                            </Badge>
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={isPending}
                                onClick={() => handleMarkRefunded(order.id)}
                                className="shrink-0 gap-2"
                            >
                                {processingId === order.id && (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                )}
                                Marquer remboursé
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
