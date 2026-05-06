"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { initiateTicketPayment } from "@/actions/payment.actions";
import { toast } from "sonner";
import { Minus, Plus, Loader2, Ticket } from "lucide-react";

interface Props {
    ticket: {
        id: string;
        title: string;
        price: number;
        totalStock: number | null;
    };
    isLoggedIn: boolean;
    remainingStock: number | null;
}

export function BuyTicketButton({ ticket, isLoggedIn, remainingStock }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [isPending, startTransition] = useTransition();

    const isSoldOut = remainingStock !== null && remainingStock <= 0;
    const maxQty =
        remainingStock !== null ? Math.min(remainingStock, 10) : 10;

    function handleOpen() {
        if (!isLoggedIn) {
            router.push("/sign-in");
            return;
        }
        setQuantity(1);
        setOpen(true);
    }

    function handleSubmit() {
        startTransition(async () => {
            const formData = new FormData();
            formData.set("ticketId", ticket.id);
            formData.set("quantity", String(quantity));

            const result = await initiateTicketPayment(formData);

            if (result.error) {
                toast.error(result.error);
                return;
            }

            if (result.redirectUrl) {
                window.location.href = result.redirectUrl;
            }
        });
    }

    const totalPrice = ticket.price * quantity;

    return (
        <>
            <Button onClick={handleOpen} disabled={isSoldOut} size="sm">
                {isSoldOut ? "Complet" : "Acheter"}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Ticket className="w-5 h-5 text-secondary" />
                            {ticket.title}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 pt-2">
                        {/* Sélecteur de quantité */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                Quantité
                            </span>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                        setQuantity((q) => Math.max(1, q - 1))
                                    }
                                    disabled={quantity <= 1 || isPending}
                                >
                                    <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-6 text-center font-bold text-lg">
                                    {quantity}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                        setQuantity((q) =>
                                            Math.min(maxQty, q + 1),
                                        )
                                    }
                                    disabled={quantity >= maxQty || isPending}
                                >
                                    <Plus className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>

                        {remainingStock !== null && (
                            <p className="text-xs text-muted-foreground text-center">
                                {remainingStock} place(s) disponible(s)
                            </p>
                        )}

                        {/* Récapitulatif + bouton paiement */}
                        <div className="border-t pt-5 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">
                                    Total
                                </p>
                                <p className="text-2xl font-bold text-secondary">
                                    {totalPrice === 0
                                        ? "Gratuit"
                                        : `${totalPrice.toLocaleString("fr-FR")} FCFA`}
                                </p>
                            </div>
                            <Button
                                onClick={handleSubmit}
                                disabled={isPending}
                                size="lg"
                                className="gap-2"
                            >
                                {isPending && (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                )}
                                {isPending
                                    ? "Redirection…"
                                    : totalPrice === 0
                                      ? "Réserver"
                                      : "Payer"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
