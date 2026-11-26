"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    IconLoader2,
    IconAlertCircle,
    IconMailCheck,
} from "@tabler/icons-react";
import { toast } from "sonner";

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") ?? "";
    const redirectUrl = searchParams.get("redirect_url") ?? "/dashboard";

    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!email) router.push("/sign-in");
    }, [email, router]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const { error: err } = await authClient.emailOtp.verifyEmail({
            email,
            otp: otp.trim(),
        });

        if (err) {
            const message =
                err.code === "OTP_EXPIRED"
                    ? "Ce code a expiré. Cliquez sur « Renvoyer le code » pour en recevoir un nouveau."
                    : err.code === "TOO_MANY_ATTEMPTS"
                      ? "Trop d'essais avec ce code. Cliquez sur « Renvoyer le code » pour en recevoir un nouveau."
                      : err.code === "INVALID_OTP"
                        ? "Code incorrect. Vérifiez le dernier email reçu et réessayez."
                        : "Impossible de vérifier le code pour le moment. Réessayez.";
            setError(message);
            setIsLoading(false);
            return;
        }

        // La vérification connecte directement (autoSignInAfterVerification) :
        // rechargement complet pour que toute l'app voie la nouvelle session.
        toast.success("Email vérifié ! Bienvenue sur Benin Events.");
        window.location.assign(redirectUrl);
    };

    const handleResend = async () => {
        setIsResending(true);
        setError(null);

        const { error: err } = await authClient.emailOtp.sendVerificationOtp({
            email,
            type: "email-verification",
        });

        if (err) {
            setError(
                err.status === 429
                    ? "Trop de demandes. Patientez une minute avant de redemander un code."
                    : "Impossible de renvoyer le code pour le moment. Réessayez.",
            );
        } else {
            setOtp("");
            toast.success("Nouveau code envoyé ! Pensez à regarder dans les spams.");
        }
        setIsResending(false);
    };

    if (!email) return null;

    return (
        <section className="min-h-screen flex items-center justify-center overflow-hidden bg-background py-8 px-4">
            <div className="w-full max-w-md mx-auto">
                <div className="bg-primary rounded-4xl p-8 sm:p-10 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="bg-secondary rounded-xl px-5 py-4 w-fit mx-auto flex items-center justify-center">
                            <IconMailCheck className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-3xl mb-3 font-afo text-secondary mt-4">
                            Vérifiez votre email
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Un code à 6 chiffres a été envoyé à{" "}
                            <span className="font-bold text-foreground">
                                {email}
                            </span>
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-3">
                            <IconAlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                            <p className="text-sm text-destructive font-medium">
                                {error}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleVerify} className="space-y-4 mb-6">
                        <div className="space-y-2">
                            <Label htmlFor="otp">Code de vérification</Label>
                            <Input
                                id="otp"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                pattern="[0-9]{6}"
                                maxLength={6}
                                placeholder="123456"
                                value={otp}
                                onChange={(e) =>
                                    setOtp(e.target.value.replace(/\D/g, ""))
                                }
                                required
                                className="h-14 rounded-xl text-center text-2xl tracking-[0.5em] font-bold"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading || otp.length !== 6}
                            className="w-full h-12 rounded-xl text-base font-bold bg-secondary text-primary hover:bg-secondary/90"
                        >
                            {isLoading ? (
                                <IconLoader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                "Vérifier"
                            )}
                        </Button>
                    </form>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={isResending}
                            className="text-sm text-secondary hover:text-secondary/80 transition-colors font-medium disabled:opacity-50"
                        >
                            {isResending
                                ? "Envoi en cours…"
                                : "Renvoyer le code"}
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <Link
                        href="/sign-in"
                        className="inline-flex items-center text-sm text-muted-foreground/60 hover:text-foreground transition-colors font-medium"
                    >
                        ← Retour à la connexion
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense>
            <VerifyEmailContent />
        </Suspense>
    );
}
