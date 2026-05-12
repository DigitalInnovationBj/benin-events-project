"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initiateTicketPayment } from "@/actions/payment.actions";
import type { Attendee } from "@/actions/payment.actions";
import { toast } from "sonner";
import { Minus, Plus, Loader2, Ticket, ChevronDown, ChevronUp, Users } from "lucide-react";

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
    const [open, setOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [isPending, startTransition] = useTransition();

    // Champs invité
    const [guestName, setGuestName] = useState("");
    const [guestEmail, setGuestEmail] = useState("");

    // Participants
    const [showAttendees, setShowAttendees] = useState(false);
    const [attendees, setAttendees] = useState<{ name: string; email: string }[]>([]);

    const isFree = ticket.price === 0;
    const isSoldOut = remainingStock !== null && remainingStock <= 0;
    const maxQty = remainingStock !== null ? Math.min(remainingStock, 10) : 10;

    // Synchronise la taille du tableau participants avec la quantité
    useEffect(() => {
        setAttendees(prev =>
            Array.from({ length: quantity }, (_, i) => prev[i] ?? { name: "", email: "" })
        );
    }, [quantity]);

    function handleOpen() {
        setQuantity(1);
        setGuestName("");
        setGuestEmail("");
        setShowAttendees(false);
        setAttendees([{ name: "", email: "" }]);
        setOpen(true);
    }

    function updateAttendee(index: number, field: "name" | "email", value: string) {
        setAttendees(prev => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
    }

    function handleSubmit() {
        startTransition(async () => {
            const attendeesPayload: Attendee[] = showAttendees
                ? attendees.map(a => ({ name: a.name, email: a.email }))
                : [];

            const result = await initiateTicketPayment({
                ticketId: ticket.id,
                quantity,
                guestEmail: isLoggedIn ? undefined : guestEmail,
                guestName: isLoggedIn ? undefined : guestName,
                attendees: attendeesPayload,
            });

            if (result.error) {
                toast.error(result.error);
                return;
            }

            if (result.redirectUrl) {
                window.location.href = result.redirectUrl;
            }
        });
    }

    const basePrice = ticket.price * quantity;
    const fees = basePrice > 0 ? Math.ceil(basePrice * 0.05) + 100 : 0;
    const totalPrice = basePrice + fees;

    return (
        <>
            <Button onClick={handleOpen} disabled={isSoldOut} size="sm">
                {isSoldOut ? "Complet" : isFree ? "Obtenir" : "Acheter"}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Ticket className="w-5 h-5 text-secondary shrink-0" />
                            {ticket.title}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5 pt-1">
                        {/* ── Infos invité (non connecté uniquement) ──── */}
                        {!isLoggedIn && (
                            <div className="space-y-3 p-4 bg-muted/40 rounded-xl border">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Vos informations
                                </p>
                                <div className="space-y-2">
                                    <div>
                                        <Label htmlFor="guest-name" className="text-sm">
                                            Nom complet <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="guest-name"
                                            placeholder="Ex : Kofi Mensah"
                                            value={guestName}
                                            onChange={e => setGuestName(e.target.value)}
                                            disabled={isPending}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="guest-email" className="text-sm">
                                            Email <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="guest-email"
                                            type="email"
                                            placeholder="votre@email.com"
                                            value={guestEmail}
                                            onChange={e => setGuestEmail(e.target.value)}
                                            disabled={isPending}
                                            className="mt-1"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Vos billets seront envoyés à cet email.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Quantité ──────────────────────────────── */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Quantité</span>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    disabled={quantity <= 1 || isPending}
                                >
                                    <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-6 text-center font-bold text-lg">{quantity}</span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                                    disabled={quantity >= maxQty || isPending}
                                >
                                    <Plus className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>

                        {remainingStock !== null && (
                            <p className="text-xs text-muted-foreground text-center -mt-2">
                                {remainingStock} place(s) disponible(s)
                            </p>
                        )}

                        {/* ── Participants (optionnel) ──────────────── */}
                        <div className="border rounded-xl overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setShowAttendees(v => !v)}
                                disabled={isPending}
                                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/40 transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    Ajouter les informations des participants
                                    <span className="text-xs font-normal text-muted-foreground">
                                        (optionnel)
                                    </span>
                                </span>
                                {showAttendees ? (
                                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                )}
                            </button>

                            {showAttendees && (
                                <div className="px-4 pb-4 space-y-4 border-t bg-muted/20">
                                    <p className="text-xs text-muted-foreground pt-3">
                                        Chaque participant recevra son billet par email si vous renseignez son adresse.
                                    </p>
                                    {attendees.map((attendee, i) => (
                                        <div key={i} className="space-y-2">
                                            <p className="text-xs font-semibold text-foreground">
                                                Participant {i + 1}
                                            </p>
                                            <Input
                                                placeholder="Nom complet"
                                                value={attendee.name}
                                                onChange={e => updateAttendee(i, "name", e.target.value)}
                                                disabled={isPending}
                                                className="h-9 text-sm"
                                            />
                                            <Input
                                                type="email"
                                                placeholder="Email (optionnel)"
                                                value={attendee.email}
                                                onChange={e => updateAttendee(i, "email", e.target.value)}
                                                disabled={isPending}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Récapitulatif + bouton ────────────────── */}
                        <div className="border-t pt-4 space-y-4">
                            {fees > 0 && (
                                <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Billets ({quantity})</span>
                                        <span>{basePrice.toLocaleString("fr-FR")} FCFA</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Frais de service</span>
                                        <span>{fees.toLocaleString("fr-FR")} FCFA</span>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">Total</p>
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
                                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {isPending
                                        ? "Redirection…"
                                        : isFree
                                          ? "Réserver"
                                          : "Payer"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
