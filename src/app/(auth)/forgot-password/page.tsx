"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    IconLoader2,
    IconAlertCircle,
    IconKey,
} from "@tabler/icons-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const normalizedEmail = email.trim().toLowerCase();
        const { error: err } = await authClient.emailOtp.sendVerificationOtp({
            email: normalizedEmail,
            type: "forget-password",
        });

        if (err) {
            setError(err.message ?? "Impossible d'envoyer le code.");
            setIsLoading(false);
            return;
        }

        toast.success("Code envoyé ! Vérifiez votre boîte mail.");
        router.push(
            `/reset-password?email=${encodeURIComponent(normalizedEmail)}`,
        );
    };

    return (
        <section className="min-h-screen flex items-center justify-center overflow-hidden bg-background py-8 px-4">
            <div className="w-full max-w-md mx-auto">
                <div className="bg-primary rounded-4xl p-8 sm:p-10 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="bg-secondary rounded-xl px-5 py-4 w-fit mx-auto flex items-center justify-center">
                            <IconKey className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-3xl mb-3 font-afo text-secondary mt-4">
                            Mot de passe oublié
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Saisissez votre email : nous vous enverrons un code
                            pour définir un nouveau mot de passe. Fonctionne
                            aussi pour les comptes créés avec Google ou Apple.
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

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="vous@exemple.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12 rounded-xl"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl text-base font-bold bg-secondary text-primary hover:bg-secondary/90"
                        >
                            {isLoading ? (
                                <IconLoader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                "Envoyer le code"
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
