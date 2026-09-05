"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Star, Loader2 } from "lucide-react";
import { initiateFeaturedEventPayment, getPlatformPaymentStatus } from "@/actions/platform.actions";
import { MobileMoneyForm } from "@/components/payments/MobileMoneyForm";
import { MobileMoneyWaiting } from "@/components/payments/MobileMoneyWaiting";
import { usePaymentPolling } from "@/hooks/use-payment-polling";
import type { FeexpayNetwork } from "@/lib/feexpay-networks";
import { toast } from "sonner";

export function FeaturedButton({ eventId, fee }: { eventId: string; fee: number }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [network, setNetwork] = useState<FeexpayNetwork | "">("");
    const [phone, setPhone] = useState("");
    const [step, setStep] = useState<"form" | "waiting">("form");
    const polling = usePaymentPolling(getPlatformPaymentStatus);

    function handleOpen() {
        setNetwork("");
        setPhone("");
        setStep("form");
        polling.stop();
        setOpen(true);
    }

    useEffect(() => {
        if (step !== "waiting") return;
        if (polling.status === "COMPLETED") {
            toast.success("Évènement mis en vedette !");
            setOpen(false);
            router.push(`/dashboard/events/${eventId}?featured=1`);
        } else if (polling.status === "FAILED") {
            toast.error("Le paiement a échoué. Vous pouvez réessayer.");
            setStep("form");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [polling.status, step]);

    async function handleSubmit() {
        if (!network) {
            toast.error("Sélectionnez un opérateur mobile money.");
            return;
        }
        if (phone.replace(/\D/g, "").length < 6) {
            toast.error("Numéro de téléphone invalide.");
            return;
        }

        setIsLoading(true);
        const res = await initiateFeaturedEventPayment({
            eventId,
            phoneNumber: phone,
            network: network as FeexpayNetwork,
        });
        setIsLoading(false);

        if (res.error) {
            toast.error(res.error);
            return;
        }

        setStep("waiting");
        polling.start(res.platformPaymentId!);
    }

    return (
        <>
            <Button onClick={handleOpen} variant="outline" size="sm" className="gap-2">
                <Star className="w-4 h-4" />
                Mettre en vedette ({fee.toLocaleString("fr-FR")} FCFA)
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-secondary" />
                            Mettre l&apos;évènement en vedette
                        </DialogTitle>
                    </DialogHeader>

                    {step === "waiting" ? (
                        <MobileMoneyWaiting
                            phoneNumber={phone}
                            timedOut={polling.timedOut}
                            onRetryCheck={() => polling.retryNow()}
                        />
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Montant : <strong>{fee.toLocaleString("fr-FR")} FCFA</strong>
                            </p>
                            <MobileMoneyForm
                                network={network}
                                onNetworkChange={setNetwork}
                                phoneNumber={phone}
                                onPhoneNumberChange={setPhone}
                                disabled={isLoading}
                            />
                            <DialogFooter>
                                <Button onClick={handleSubmit} disabled={isLoading} className="gap-2 w-full">
                                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {isLoading ? "Envoi…" : "Payer"}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
