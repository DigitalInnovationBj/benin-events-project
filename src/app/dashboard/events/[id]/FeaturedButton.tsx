"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { IconStar, IconLoader2 } from "@tabler/icons-react";
import { initiateFeaturedEventPayment, getPlatformPaymentStatus } from "@/actions/platform.actions";
import { MobileMoneyForm } from "@/components/payments/MobileMoneyForm";
import { MobileMoneyWaiting } from "@/components/payments/MobileMoneyWaiting";
import { usePaymentPolling } from "@/hooks/use-payment-polling";
import { isValidLocalNumber, type FeexpayNetwork } from "@/lib/feexpay-networks";
import { toast } from "sonner";

interface Props {
    eventId: string;
    fee: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FeaturedButton({ eventId, fee, open, onOpenChange }: Props) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [network, setNetwork] = useState<FeexpayNetwork | "">("");
    const [phone, setPhone] = useState("");
    const [step, setStep] = useState<"form" | "waiting">("form");
    const polling = usePaymentPolling(getPlatformPaymentStatus);
    const wasOpen = useRef(false);

    useEffect(() => {
        if (open && !wasOpen.current) {
            setNetwork("");
            setPhone("");
            setStep("form");
            polling.stop();
        }
        wasOpen.current = open;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
        if (step !== "waiting") return;
        if (polling.status === "COMPLETED") {
            toast.success("Évènement mis en vedette !");
            onOpenChange(false);
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
        if (!isValidLocalNumber(phone.replace(/\D/g, ""))) {
            toast.error("Numéro de téléphone invalide (10 chiffres attendus, ex : 0190000000).");
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <IconStar className="w-5 h-5 text-secondary" />
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
                                {isLoading && <IconLoader2 className="w-4 h-4 animate-spin" />}
                                {isLoading ? "Envoi…" : "Payer"}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
