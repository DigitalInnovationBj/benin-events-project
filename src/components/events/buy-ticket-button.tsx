"use client";

import { useState, useTransition } from "react";
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
import type { TicketAssignment } from "@/actions/payment.actions";
import { validatePromoCode } from "@/actions/eventPartner.actions";
import { toast } from "sonner";
import { Minus, Plus, Loader2, Ticket, User, Users, Tag, X } from "lucide-react";

interface Props {
    eventId: string;
    ticket: {
        id: string;
        title: string;
        price: number;
        totalStock: number | null;
    };
    isLoggedIn: boolean;
    remainingStock: number | null;
    buyerName?: string;
    buyerEmail?: string;
    hasExistingTicket?: boolean;
}

type AppliedPromo = {
    code: string;
    name: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
};

type Assignment = { forSelf: boolean; name: string; email: string };

export function BuyTicketButton({
    eventId,
    ticket,
    isLoggedIn,
    remainingStock,
    buyerName,
    buyerEmail,
    hasExistingTicket = false,
}: Props) {
    const [open, setOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [isPending, startTransition] = useTransition();

    // Infos acheteur invité
    const [guestName, setGuestName] = useState("");
    const [guestEmail, setGuestEmail] = useState("");

    // Code promo partenaire
    const [promoInput, setPromoInput] = useState("");
    const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
    const [isValidatingPromo, setIsValidatingPromo] = useState(false);

    // Attribution : 1 entrée par billet
    const [assignments, setAssignments] = useState<Assignment[]>([]);

    const isFree = ticket.price === 0;
    const isSoldOut = remainingStock !== null && remainingStock <= 0;
    const maxQty = remainingStock !== null ? Math.min(remainingStock, 10) : 10;

    // Met à jour la quantité et redimensionne le tableau d'attributions en même temps
    function changeQuantity(next: number) {
        setQuantity(next);
        setAssignments(prev =>
            Array.from({ length: next }, (_, i) => {
                if (prev[i]) return prev[i];
                return { forSelf: i === 0 && !hasExistingTicket, name: "", email: "" };
            })
        );
    }

    function handleOpen() {
        setQuantity(1);
        setGuestName("");
        setGuestEmail("");
        setAssignments([{ forSelf: !hasExistingTicket, name: "", email: "" }]);
        setPromoInput("");
        setAppliedPromo(null);
        setOpen(true);
    }

    async function handleApplyPromo() {
        const code = promoInput.trim();
        if (!code) return;
        setIsValidatingPromo(true);
        const res = await validatePromoCode(eventId, code);
        setIsValidatingPromo(false);
        if (!res.success) {
            toast.error(res.error ?? "Code promo invalide.");
            return;
        }
        setAppliedPromo({
            code: code.toUpperCase(),
            name: res.name,
            discountType: res.discountType,
            discountValue: res.discountValue,
        });
        toast.success(`Code "${res.name}" appliqué !`);
    }

    function handleRemovePromo() {
        setAppliedPromo(null);
        setPromoInput("");
    }

    function toggleForSelf(index: number, value: boolean) {
        setAssignments(prev => prev.map((a, i) => i === index ? { ...a, forSelf: value } : a));
    }

    function updateAssignment(index: number, field: "name" | "email", value: string) {
        setAssignments(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
    }

    const effectiveName = isLoggedIn ? buyerName : guestName;
    const effectiveEmail = isLoggedIn ? buyerEmail : guestEmail;

    function handleSubmit() {
        startTransition(async () => {
            const payload: TicketAssignment[] = assignments.map(a => ({
                forSelf: a.forSelf,
                name: a.forSelf ? effectiveName : a.name,
                email: a.forSelf ? effectiveEmail : a.email,
            }));

            const result = await initiateTicketPayment({
                ticketId: ticket.id,
                assignments: payload,
                guestEmail: isLoggedIn ? undefined : guestEmail,
                guestName: isLoggedIn ? undefined : guestName,
                promoCode: appliedPromo?.code,
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
    const discount = appliedPromo
        ? appliedPromo.discountType === "PERCENTAGE"
            ? Math.round(basePrice * (appliedPromo.discountValue / 100))
            : Math.min(basePrice, appliedPromo.discountValue)
        : 0;
    const discountedBase = Math.max(0, basePrice - discount);
    const fees = discountedBase > 0 ? Math.ceil(discountedBase * 0.05) + 100 : 0;
    const totalPrice = discountedBase + fees;

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

                        {/* ── Bloc acheteur ─────────────────────────── */}
                        {isLoggedIn ? (
                            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border">
                                <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4 text-secondary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{buyerName}</p>
                                    <p className="text-xs text-muted-foreground truncate">{buyerEmail}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 p-4 bg-muted/40 rounded-xl border">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Vos informations (acheteur)
                                </p>
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
                                        Le récapitulatif de votre achat sera envoyé à cette adresse.
                                    </p>
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
                                    onClick={() => changeQuantity(Math.max(1, quantity - 1))}
                                    disabled={quantity <= 1 || isPending}
                                >
                                    <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-6 text-center font-bold text-lg">{quantity}</span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => changeQuantity(Math.min(maxQty, quantity + 1))}
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

                        {/* ── Attribution par billet ────────────────── */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-1">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Attribution des billets</span>
                            </div>

                            {assignments.map((assignment, i) => (
                                <div key={i} className="border rounded-xl p-3 space-y-2.5">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                            Billet {i + 1}
                                        </span>
                                        <div className="flex gap-1.5">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={assignment.forSelf ? "secondary" : "outline"}
                                                className="h-7 text-xs px-2.5"
                                                onClick={() => toggleForSelf(i, true)}
                                                disabled={isPending}
                                            >
                                                Pour moi
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={!assignment.forSelf ? "secondary" : "outline"}
                                                className="h-7 text-xs px-2.5"
                                                onClick={() => toggleForSelf(i, false)}
                                                disabled={isPending}
                                            >
                                                Pour quelqu&apos;un d&apos;autre
                                            </Button>
                                        </div>
                                    </div>

                                    {assignment.forSelf ? (
                                        <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 truncate">
                                            {effectiveName || "Vous"}
                                            {effectiveEmail ? ` — ${effectiveEmail}` : ""}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                placeholder="Nom du bénéficiaire *"
                                                value={assignment.name}
                                                onChange={e => updateAssignment(i, "name", e.target.value)}
                                                disabled={isPending}
                                                className="h-8 text-sm"
                                            />
                                            <Input
                                                type="email"
                                                placeholder="Email (optionnel)"
                                                value={assignment.email}
                                                onChange={e => updateAssignment(i, "email", e.target.value)}
                                                disabled={isPending}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* ── Code promo ────────────────────────────── */}
                        {!isFree && (
                            <div className="space-y-1.5">
                                {appliedPromo ? (
                                    <div className="flex items-center justify-between gap-2 bg-secondary/10 border border-secondary/30 rounded-lg px-3 py-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Tag className="w-3.5 h-3.5 text-secondary shrink-0" />
                                            <span className="text-sm font-medium truncate">
                                                {appliedPromo.name} appliqué
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemovePromo}
                                            className="text-muted-foreground hover:text-foreground shrink-0"
                                            aria-label="Retirer le code promo"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Code promo"
                                            value={promoInput}
                                            onChange={(e) => setPromoInput(e.target.value)}
                                            disabled={isPending || isValidatingPromo}
                                            className="h-9 text-sm"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-9 shrink-0"
                                            onClick={handleApplyPromo}
                                            disabled={!promoInput.trim() || isPending || isValidatingPromo}
                                        >
                                            {isValidatingPromo ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                "Appliquer"
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Récapitulatif + bouton ────────────────── */}
                        <div className="border-t pt-4 space-y-4">
                            {fees > 0 && (
                                <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Billets ({quantity})</span>
                                        <span>{basePrice.toLocaleString("fr-FR")} FCFA</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-secondary font-medium">
                                            <span>Réduction ({appliedPromo?.name})</span>
                                            <span>-{discount.toLocaleString("fr-FR")} FCFA</span>
                                        </div>
                                    )}
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
                                    {isPending ? "Redirection…" : isFree ? "Réserver" : "Payer"}
                                </Button>
                            </div>
                        </div>

                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
