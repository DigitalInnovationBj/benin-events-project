"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    IconArrowLeft,
    IconArrowRight,
    IconLoader2,
    IconTag,
    IconX,
    IconUser,
    IconUsers,
    IconCircleCheck,
    IconCreditCard,
    IconDeviceMobile,
    IconLock,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileMoneyForm } from "@/components/payments/MobileMoneyForm";
import { MobileMoneyWaiting } from "@/components/payments/MobileMoneyWaiting";
import { usePaymentPolling } from "@/hooks/use-payment-polling";
import {
    initiateTicketPayment,
    getOrderPaymentStatus,
    type CartLine,
} from "@/actions/payment.actions";
import { validatePromoCode } from "@/actions/eventPartner.actions";
import {
    getNetwork,
    isValidLocalNumber,
    type FeexpayNetwork,
} from "@/lib/feexpay-networks";
import { formatXOF, formatEventDateTime } from "@/lib/format";
import { encodeCart } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { CARD_MIN_AMOUNT, cardFeeFor } from "@/lib/card-fee";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type CheckoutLine = {
    ticketId: string;
    title: string;
    price: number;
    quantity: number;
    requested: number;
    remainingStock: number | null;
};

type AppliedPromo = {
    code: string;
    name: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
};

/** Une place à attribuer : rattachée à sa catégorie de billet. */
type Seat = {
    key: string;
    ticketId: string;
    ticketTitle: string;
    forSelf: boolean;
    name: string;
    email: string;
};

interface Props {
    eventId: string;
    event: {
        slug: string;
        title: string;
        startDate: Date;
        location: string | null;
        eventType: string;
        imageUrl: string | null;
    };
    lines: CheckoutLine[];
    buyer: { name: string; email: string } | null;
    hasExistingTicket: boolean;
    /** Frais du paiement par carte (GeniusPay), en %, ajoutés au prix. */
    cardFeePercent: number;
}

const STEPS = ["Récapitulatif", "Participants", "Paiement"] as const;

// ─────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────

export function CheckoutFlow({
    eventId,
    event,
    lines,
    buyer,
    hasExistingTicket,
    cardFeePercent,
}: Props) {
    const router = useRouter();
    const isLoggedIn = buyer !== null;

    // L'étape vit en état local : la passer par l'URL ferait remonter la page
    // serveur à chaque transition et remonterait le formulaire, faisant perdre
    // les noms déjà saisis. Le panier, lui, reste dans l'URL (partageable).
    const [step, setStep] = useState(0);
    const [isPending, startTransition] = useTransition();

    // Invité
    const [guestName, setGuestName] = useState("");
    const [guestEmail, setGuestEmail] = useState("");

    // Promo
    const [promoInput, setPromoInput] = useState("");
    const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
    const [isValidatingPromo, setIsValidatingPromo] = useState(false);
    const [promoOpen, setPromoOpen] = useState(false);

    // Paiement
    const [paymentMethod, setPaymentMethod] = useState<"mobile_money" | "card">("mobile_money");
    const [network, setNetwork] = useState<FeexpayNetwork | "">("");
    const [phone, setPhone] = useState("");
    const [waiting, setWaiting] = useState(false);
    const orderIdRef = useRef<string | null>(null);

    // Panier encodé, pour permettre une reprise après échec sans avoir à
    // resélectionner les billets.
    const cartParam = encodeCart(
        lines.map((l) => ({ ticketId: l.ticketId, quantity: l.quantity })),
    );

    // La résolution du paiement est un évènement : le hook nous rappelle,
    // plutôt que d'observer `status` dans un effet.
    const polling = usePaymentPolling(getOrderPaymentStatus, {
        onSettled: (status) => {
            if (status === "COMPLETED") {
                router.push(`/checkout/success?orderId=${orderIdRef.current}`);
                return;
            }
            // Refus définitif de l'opérateur : un toast sur un écran d'attente
            // ne dit ni pourquoi, ni quoi faire ensuite.
            router.push(
                `/checkout/error?event=${event.slug}&panier=${encodeURIComponent(cartParam)}`,
            );
        },
    });

    // ── Places à attribuer ────────────────────────────────────────────────
    const [seats, setSeats] = useState<Seat[]>(() =>
        lines.flatMap((line) =>
            Array.from({ length: line.quantity }, (_, i) => ({
                key: `${line.ticketId}-${i}`,
                ticketId: line.ticketId,
                ticketTitle: line.title,
                // Le premier billet est pour l'acheteur, sauf s'il en a déjà un.
                forSelf: i === 0 && line === lines[0] && !hasExistingTicket,
                name: "",
                email: "",
            })),
        ),
    );

    // ── Montants ──────────────────────────────────────────────────────────
    const baseAmount = useMemo(
        () => lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
        [lines],
    );
    const discount = appliedPromo
        ? appliedPromo.discountType === "PERCENTAGE"
            ? Math.round(baseAmount * (appliedPromo.discountValue / 100))
            : Math.min(baseAmount, appliedPromo.discountValue)
        : 0;
    const total = Math.max(0, baseAmount - discount);
    // Carte : frais GeniusPay ajoutés au prix ; minimum imposé par GeniusPay.
    const cardFee = cardFeeFor(total, cardFeePercent);
    const cardAvailable = total > 0 && total + cardFee >= CARD_MIN_AMOUNT;
    const payByCard = paymentMethod === "card" && cardAvailable;
    const amountDue = payByCard ? total + cardFee : total;
    const isFree = total === 0;
    const totalQuantity = lines.reduce((n, l) => n + l.quantity, 0);

    // Lignes réduites faute de stock : l'utilisateur doit le savoir.
    const reduced = lines.filter((l) => l.quantity < l.requested);

    // ── Actions ───────────────────────────────────────────────────────────

    async function applyPromo() {
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
        toast.success(`Code « ${res.name} » appliqué.`);
    }

    function updateSeat(key: string, patch: Partial<Seat>) {
        setSeats((prev) =>
            prev.map((s) => (s.key === key ? { ...s, ...patch } : s)),
        );
    }

    /** Validation de l'étape courante avant de passer à la suivante. */
    function validateStep(): string | null {
        if (step === 1) {
            if (!isLoggedIn) {
                if (!guestName.trim()) return "Votre nom est requis.";
                if (!guestEmail.trim()) return "Votre adresse email est requise.";
            }
            for (const seat of seats) {
                if (seat.forSelf) continue;
                if (!seat.name.trim()) {
                    return `Indiquez le nom du participant pour « ${seat.ticketTitle} ».`;
                }
            }
        }
        return null;
    }

    function next() {
        const error = validateStep();
        if (error) {
            toast.error(error);
            return;
        }
        setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }

    function submit() {
        if (!isFree && !payByCard) {
            if (!network) {
                toast.error("Sélectionnez un opérateur mobile money.");
                return;
            }
            const netInfo = getNetwork(network);
            if (
                !netInfo ||
                !isValidLocalNumber(
                    phone.replace(/\D/g, ""),
                    netInfo.countryCode,
                )
            ) {
                toast.error("Numéro de téléphone invalide.");
                return;
            }
        }

        const effectiveName = isLoggedIn ? buyer.name : guestName;
        const effectiveEmail = isLoggedIn ? buyer.email : guestEmail;

        // Regroupe les places par catégorie : une ligne de panier par billet.
        const items: CartLine[] = lines.map((line) => ({
            ticketId: line.ticketId,
            assignments: seats
                .filter((s) => s.ticketId === line.ticketId)
                .map((s) => ({
                    forSelf: s.forSelf,
                    name: s.forSelf ? effectiveName : s.name,
                    email: s.forSelf ? effectiveEmail : s.email,
                })),
        }));

        startTransition(async () => {
            const result = await initiateTicketPayment({
                items,
                guestEmail: isLoggedIn ? undefined : guestEmail,
                guestName: isLoggedIn ? undefined : guestName,
                promoCode: appliedPromo?.code,
                paymentMethod: payByCard ? "card" : "mobile_money",
                phoneNumber: isFree || payByCard ? undefined : phone,
                network: isFree || payByCard ? undefined : (network as FeexpayNetwork),
            });

            if (result.error) {
                // Un refus du prestataire mérite une page qui explique et
                // propose de reprendre ; une erreur de saisie (opérateur,
                // numéro, stock) se corrige sur place, on garde le toast.
                if ("paymentFailed" in result && result.paymentFailed) {
                    router.push(
                        `/checkout/error?event=${event.slug}&panier=${encodeURIComponent(cartParam)}&raison=${encodeURIComponent(result.error)}`,
                    );
                    return;
                }
                toast.error(result.error);
                return;
            }

            if (result.isFree) {
                router.push(`/checkout/success?orderId=${result.orderId}`);
                return;
            }

            // Carte : page de paiement sécurisée GeniusPay, retour ensuite sur
            // la page de confirmation, qui revérifie le paiement.
            if ("redirectUrl" in result && result.redirectUrl) {
                window.location.href = result.redirectUrl;
                return;
            }

            orderIdRef.current = result.orderId!;
            setWaiting(true);
            polling.start(result.orderId!);
        });
    }

    // ── Écran d'attente mobile money ──────────────────────────────────────
    if (waiting) {
        return (
            <div className="max-w-lg mx-auto px-4 py-16">
                <div className="bg-card border rounded-3xl p-8 shadow-xl">
                    <MobileMoneyWaiting
                        phoneNumber={phone}
                        timedOut={polling.timedOut}
                        onRetryCheck={polling.retryNow}
                        connectionIssue={polling.connectionIssue}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
            {/* ── Fil d'étapes ─────────────────────────────────────────── */}
            <div className="mb-8">
                <Link
                    href={`/events/${event.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                    <IconArrowLeft className="w-4 h-4" aria-hidden="true" />
                    Retour à l&apos;évènement
                </Link>

                <h1 className="text-4xl font-afo mb-1">{event.title}</h1>
                <p className="text-sm text-muted-foreground">
                    {formatEventDateTime(event.startDate)}
                    {event.eventType === "IN_PERSON" && event.location
                        ? ` · ${event.location}`
                        : ""}
                </p>

                {/* Les trois libellés côte à côte débordaient sur mobile :
                    seule l'étape courante y est nommée, les autres se
                    réduisent à leur numéro. */}
                <ol
                    className="flex items-center gap-1 sm:gap-2 mt-6"
                    aria-label="Étapes"
                >
                    {STEPS.map((label, i) => (
                        <li key={label} className="flex items-center gap-1 sm:gap-2 min-w-0">
                            <span
                                className={cn(
                                    "flex items-center gap-1.5 rounded-full px-2 py-1 text-xs sm:px-3 sm:text-sm",
                                    i === step
                                        ? "bg-secondary text-secondary-foreground font-semibold"
                                        : i < step
                                          ? "text-muted-foreground"
                                          : "text-muted-foreground/50",
                                )}
                                aria-current={i === step ? "step" : undefined}
                            >
                                {i < step ? (
                                    <IconCircleCheck
                                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <span className="tabular-nums">{i + 1}</span>
                                )}
                                <span
                                    className={cn(
                                        "truncate",
                                        i === step ? "inline" : "hidden sm:inline",
                                    )}
                                >
                                    {label}
                                </span>
                            </span>
                            {i < STEPS.length - 1 && (
                                <span
                                    className="text-muted-foreground/30 text-xs sm:text-sm"
                                    aria-hidden="true"
                                >
                                    ›
                                </span>
                            )}
                        </li>
                    ))}
                </ol>
            </div>

            <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                {/* ══ Étape 1 — Récapitulatif ═══════════════════════════ */}
                {step === 0 && (
                    <>
                        <h2 className="text-2xl font-afo">Votre commande</h2>

                        {reduced.length > 0 && (
                            <p
                                className="text-sm rounded-xl border border-warning/40 bg-warning/10 px-4 py-3"
                                role="status"
                            >
                                Certaines quantités ont été ajustées faute de
                                places disponibles.
                            </p>
                        )}

                        <ul className="divide-y">
                            {lines.map((line) => (
                                <li
                                    key={line.ticketId}
                                    className="flex items-center justify-between gap-4 py-3"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {line.title}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatXOF(line.price)} ×{" "}
                                            {line.quantity}
                                        </p>
                                    </div>
                                    <span className="font-semibold whitespace-nowrap">
                                        {formatXOF(line.price * line.quantity, {
                                            zeroLabel: null,
                                        })}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        {/* Code promo — replié par défaut : la majorité des
                            acheteurs n'en a pas, un champ toujours ouvert
                            suggère à tort qu'il en faut un. */}
                        {appliedPromo ? (
                            <div className="flex items-center justify-between gap-3 rounded-xl border border-secondary/40 bg-secondary/10 px-4 py-2.5">
                                <span className="flex items-center gap-2 text-sm font-medium min-w-0">
                                    <IconTag
                                        className="w-4 h-4 text-secondary shrink-0"
                                        aria-hidden="true"
                                    />
                                    <span className="truncate">
                                        {appliedPromo.name}
                                    </span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAppliedPromo(null);
                                        setPromoInput("");
                                        setPromoOpen(false);
                                    }}
                                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                    aria-label="Retirer le code promo"
                                >
                                    <IconX className="w-4 h-4" aria-hidden="true" />
                                </button>
                            </div>
                        ) : promoOpen ? (
                            <div className="space-y-2">
                                <Label htmlFor="promo" className="text-sm">
                                    Code promo
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="promo"
                                        autoFocus
                                        value={promoInput}
                                        onChange={(e) =>
                                            setPromoInput(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                applyPromo();
                                            }
                                        }}
                                        placeholder="Votre code"
                                        className="uppercase"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={applyPromo}
                                        disabled={
                                            isValidatingPromo || !promoInput.trim()
                                        }
                                    >
                                        {isValidatingPromo ? (
                                            <IconLoader2
                                                className="w-4 h-4 animate-spin"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            "Appliquer"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setPromoOpen(true)}
                                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
                                >
                                    <IconTag className="w-3.5 h-3.5" aria-hidden="true" />
                                    J&apos;ai un code promo
                                </button>
                            </div>
                        )}

                        <Totals
                            baseAmount={baseAmount}
                            discount={discount}
                            cardFee={0}
                            total={total}
                        />

                        <Button className="w-full" size="lg" onClick={next}>
                            Continuer
                            <IconArrowRight
                                className="w-4 h-4"
                                aria-hidden="true"
                            />
                        </Button>
                    </>
                )}

                {/* ══ Étape 2 — Participants ════════════════════════════ */}
                {step === 1 && (
                    <>
                        <h2 className="text-2xl font-afo">
                            À qui sont ces billets ?
                        </h2>

                        {!isLoggedIn && (
                            <div className="space-y-4 rounded-2xl border bg-muted/30 p-4">
                                <p className="text-sm font-medium">
                                    Vos coordonnées
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Vos billets seront envoyés à cette adresse.
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="guestName">
                                            Nom complet
                                        </Label>
                                        <Input
                                            id="guestName"
                                            value={guestName}
                                            onChange={(e) =>
                                                setGuestName(e.target.value)
                                            }
                                            autoComplete="name"
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="guestEmail">Email</Label>
                                        <Input
                                            id="guestEmail"
                                            type="email"
                                            value={guestEmail}
                                            onChange={(e) =>
                                                setGuestEmail(e.target.value)
                                            }
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <ul className="space-y-4">
                            {seats.map((seat, index) => (
                                <li
                                    key={seat.key}
                                    className="rounded-2xl border p-4 space-y-3"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold">
                                            Billet {index + 1} ·{" "}
                                            <span className="text-muted-foreground font-normal">
                                                {seat.ticketTitle}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={
                                                seat.forSelf
                                                    ? "secondary"
                                                    : "outline"
                                            }
                                            size="sm"
                                            className="min-w-0 flex-1"
                                            onClick={() =>
                                                updateSeat(seat.key, {
                                                    forSelf: true,
                                                })
                                            }
                                        >
                                            <IconUser
                                                className="w-4 h-4"
                                                aria-hidden="true"
                                            />
                                            Pour moi
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={
                                                seat.forSelf
                                                    ? "outline"
                                                    : "secondary"
                                            }
                                            size="sm"
                                            className="min-w-0 flex-1"
                                            onClick={() =>
                                                updateSeat(seat.key, {
                                                    forSelf: false,
                                                })
                                            }
                                        >
                                            <IconUsers
                                                className="w-4 h-4"
                                                aria-hidden="true"
                                            />
                                            Quelqu&apos;un d&apos;autre
                                        </Button>
                                    </div>

                                    {!seat.forSelf && (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="grid gap-1.5">
                                                <Label
                                                    htmlFor={`name-${seat.key}`}
                                                >
                                                    Nom du participant
                                                </Label>
                                                <Input
                                                    id={`name-${seat.key}`}
                                                    value={seat.name}
                                                    onChange={(e) =>
                                                        updateSeat(seat.key, {
                                                            name: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label
                                                    htmlFor={`email-${seat.key}`}
                                                >
                                                    Email (facultatif)
                                                </Label>
                                                <Input
                                                    id={`email-${seat.key}`}
                                                    type="email"
                                                    value={seat.email}
                                                    onChange={(e) =>
                                                        updateSeat(seat.key, {
                                                            email: e.target.value,
                                                        })
                                                    }
                                                    placeholder="Pour lui envoyer son billet"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>

                        <StepNav onBack={() => setStep(0)} onNext={next} />
                    </>
                )}

                {/* ══ Étape 3 — Paiement ════════════════════════════════ */}
                {step === 2 && (
                    <>
                        <h2 className="text-2xl font-afo">
                            {isFree ? "Confirmation" : "Paiement"}
                        </h2>

                        <Totals
                            baseAmount={baseAmount}
                            discount={discount}
                            cardFee={payByCard ? cardFee : 0}
                            total={amountDue}
                        />

                        {!isFree && (
                            <PaymentMethodPicker
                                value={payByCard ? "card" : "mobile_money"}
                                onChange={setPaymentMethod}
                                cardAvailable={cardAvailable}
                                cardFee={cardFee}
                                disabled={isPending}
                            />
                        )}

                        {!isFree && !payByCard && (
                            <MobileMoneyForm
                                network={network}
                                onNetworkChange={setNetwork}
                                phoneNumber={phone}
                                onPhoneNumberChange={setPhone}
                                disabled={isPending}
                            />
                        )}

                        {payByCard && (
                            <p className="flex items-start gap-2 rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
                                <IconLock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                Vous allez être redirigé vers la page de paiement
                                sécurisée de GeniusPay pour saisir votre carte Visa ou
                                Mastercard. Vos billets arrivent par email dès le
                                paiement confirmé.
                            </p>
                        )}

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep(1)}
                                disabled={isPending}
                            >
                                <IconArrowLeft
                                    className="w-4 h-4"
                                    aria-hidden="true"
                                />
                                Retour
                            </Button>
                            <Button
                                className="flex-1"
                                size="lg"
                                onClick={submit}
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <>
                                        <IconLoader2
                                            className="w-4 h-4 animate-spin"
                                            aria-hidden="true"
                                        />
                                        Envoi…
                                    </>
                                ) : isFree ? (
                                    `Confirmer ${totalQuantity} billet${totalQuantity > 1 ? "s" : ""}`
                                ) : (
                                    `Payer ${formatXOF(amountDue, { zeroLabel: null })}${payByCard ? " par carte" : ""}`
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Sous-composants
// ─────────────────────────────────────────────

function Totals({
    baseAmount,
    discount,
    cardFee,
    total,
}: {
    baseAmount: number;
    discount: number;
    cardFee: number;
    total: number;
}) {
    return (
        <div className="rounded-2xl bg-muted/40 p-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total</span>
                <span>{formatXOF(baseAmount, { zeroLabel: null })}</span>
            </div>
            {discount > 0 && (
                <div className="flex justify-between text-secondary">
                    <span>Remise</span>
                    <span>−{formatXOF(discount, { zeroLabel: null })}</span>
                </div>
            )}
            {cardFee > 0 && (
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Frais de paiement par carte</span>
                    <span>+{formatXOF(cardFee, { zeroLabel: null })}</span>
                </div>
            )}
            <div className="flex justify-between border-t pt-2 font-bold text-base">
                <span>Total</span>
                <span className="text-secondary">{formatXOF(total)}</span>
            </div>
        </div>
    );
}

function PaymentMethodPicker({
    value,
    onChange,
    cardAvailable,
    cardFee,
    disabled,
}: {
    value: "mobile_money" | "card";
    onChange: (v: "mobile_money" | "card") => void;
    cardAvailable: boolean;
    cardFee: number;
    disabled?: boolean;
}) {
    const options = [
        {
            id: "mobile_money" as const,
            icon: IconDeviceMobile,
            title: "Mobile Money",
            hint: "MTN, Moov, Celtiis",
            enabled: true,
        },
        {
            id: "card" as const,
            icon: IconCreditCard,
            title: "Carte bancaire",
            hint: cardAvailable
                ? `Visa, Mastercard · +${formatXOF(cardFee, { zeroLabel: null })} de frais`
                : `À partir de ${CARD_MIN_AMOUNT} FCFA`,
            enabled: cardAvailable,
        },
    ];

    return (
        <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">Moyen de paiement</legend>
            <div className="grid gap-2 sm:grid-cols-2">
                {options.map((o) => {
                    const selected = value === o.id;
                    return (
                        <label
                            key={o.id}
                            className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                                selected && "border-secondary bg-secondary/10",
                                (!o.enabled || disabled) && "cursor-not-allowed opacity-50",
                            )}
                        >
                            <input
                                type="radio"
                                name="paymentMethod"
                                value={o.id}
                                checked={selected}
                                disabled={!o.enabled || disabled}
                                onChange={() => onChange(o.id)}
                                className="sr-only"
                            />
                            <o.icon
                                className={cn("size-5 shrink-0", selected ? "text-secondary" : "text-muted-foreground")}
                                aria-hidden="true"
                            />
                            <span className="min-w-0">
                                <span className="block text-sm font-medium">{o.title}</span>
                                <span className="block text-xs text-muted-foreground">{o.hint}</span>
                            </span>
                        </label>
                    );
                })}
            </div>
        </fieldset>
    );
}

function StepNav({
    onBack,
    onNext,
}: {
    onBack: () => void;
    onNext: () => void;
}) {
    return (
        <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onBack}>
                <IconArrowLeft className="w-4 h-4" aria-hidden="true" />
                Retour
            </Button>
            <Button className="flex-1" size="lg" onClick={onNext}>
                Continuer
                <IconArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
        </div>
    );
}
