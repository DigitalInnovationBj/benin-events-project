"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, LockKeyhole } from "lucide-react";
import { toast } from "sonner";

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") ?? "";

    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!email) router.push("/forgot-password");
    }, [email, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 8) {
            setError("Le mot de passe doit contenir au moins 8 caractères.");
            return;
        }

        setIsLoading(true);
        setError(null);

        const { error: err } = await authClient.emailOtp.resetPassword({
            email,
            otp: otp.trim(),
            password,
        });

        if (err) {
            setError(err.message ?? "Code invalide ou expiré. Réessayez.");
            setIsLoading(false);
            return;
        }

        toast.success("Mot de passe mis à jour ! Connectez-vous.");
        router.push("/sign-in");
    };

    if (!email) return null;

    return (
        <section className="min-h-screen flex items-center justify-center overflow-hidden bg-background py-8 px-4">
            <div className="w-full max-w-md mx-auto">
                <div className="bg-primary rounded-4xl p-8 sm:p-10 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="bg-secondary rounded-xl px-5 py-4 w-fit mx-auto flex items-center justify-center">
                            <LockKeyhole className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-3xl mb-3 font-afo text-secondary mt-4">
                            Nouveau mot de passe
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Saisissez le code reçu à{" "}
                            <span className="font-bold text-foreground">
                                {email}
                            </span>{" "}
                            et choisissez un nouveau mot de passe.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                            <p className="text-sm text-destructive font-medium">
                                {error}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="otp">Code reçu par email</Label>
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
                        <div className="space-y-2">
                            <Label htmlFor="password">
                                Nouveau mot de passe
                            </Label>
                            <PasswordInput
                                id="password"
                                autoComplete="new-password"
                                placeholder="8 caractères minimum"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                                className="h-12 rounded-xl"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading || otp.length !== 6}
                            className="w-full h-12 rounded-xl text-base font-bold bg-secondary text-primary hover:bg-secondary/90"
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                "Réinitialiser le mot de passe"
                            )}
                        </Button>
                    </form>
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

export default function ResetPasswordPage() {
    return (
        <Suspense>
            <ResetPasswordContent />
        </Suspense>
    );
}
