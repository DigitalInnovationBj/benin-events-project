"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
    IconLoader2,
    IconAlertCircle,
} from "@tabler/icons-react";
import { IconBrandGoogleFilled } from "@tabler/icons-react";
import { toast } from "sonner";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect_url") ?? "/dashboard";

    const { data: session, isPending } = useSession();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState<"email" | "google" | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (session) router.push(redirectUrl);
    }, [session, router, redirectUrl]);

    if (isPending || session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <IconLoader2 className="h-8 w-8 animate-spin text-secondary" />
            </div>
        );
    }

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading("email");
        setError(null);

        const { error: err } = await authClient.signIn.email({
            email: email.trim().toLowerCase(),
            password,
            callbackURL: redirectUrl,
        });

        if (err) {
            if (err.status === 403) {
                // Email non vérifié : on envoie un nouveau code avant d'aller
                // sur la page de saisie (better-auth ne le fait pas tout seul).
                await authClient.emailOtp.sendVerificationOtp({
                    email: email.trim().toLowerCase(),
                    type: "email-verification",
                });
                toast.success("Un code de vérification vient de vous être envoyé.");
                router.push(
                    `/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}&redirect_url=${encodeURIComponent(redirectUrl)}`,
                );
                return;
            }
            const message =
                err.status === 401
                    ? "Email ou mot de passe incorrect."
                    : (err.message ?? "Erreur lors de la connexion");
            setError(message);
            toast.error(message);
            setIsLoading(null);
            return;
        }

        router.push(redirectUrl);
    };

    const handleGoogleSignIn = async () => {
        setIsLoading("google");
        setError(null);

        const { error: err } = await authClient.signIn.social({
            provider: "google",
            callbackURL: redirectUrl,
        });

        if (err) {
            const message = err.message ?? "Erreur lors de la connexion Google";
            setError(message);
            toast.error(message);
            setIsLoading(null);
        }
    };

    return (
        <section className="min-h-screen flex items-center justify-center overflow-hidden bg-background py-8 px-4">
            <div className="w-full max-w-md mx-auto">
                <div className="bg-primary rounded-4xl p-8 sm:p-10 shadow-2xl transition-all hover:shadow-primary/5">
                    <div className="text-center mb-8">
                        <div className="bg-secondary rounded-xl px-5 py-4 w-fit mx-auto flex items-center justify-center">
                            <span className="text-4xl font-afo text-primary">
                                BE
                            </span>
                        </div>
                        <h1 className="text-4xl mb-3 font-afo text-secondary">
                            Bon Retour
                        </h1>
                        <p className="text-sm">
                            Connectez-vous pour accéder à vos évènements et
                            billets
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <IconAlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                            <p className="text-sm text-destructive font-medium">
                                {error}
                            </p>
                        </div>
                    )}

                    <Button
                        onClick={handleGoogleSignIn}
                        disabled={isLoading !== null}
                        variant="outline"
                        className="w-full overflow-hidden group border-white/10 dark:hover:bg-white/5 hover:border-secondary/50 h-14 rounded-xl text-base font-medium transition-all duration-300 mb-6"
                    >
                        {isLoading === "google" ? (
                            <IconLoader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <IconBrandGoogleFilled className="mr-3 h-6 w-6" />{" "}
                                Continuer avec Google
                            </>
                        )}
                    </Button>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 border-t border-white/10" />
                        <span className="text-xs text-muted-foreground uppercase">
                            ou
                        </span>
                        <div className="flex-1 border-t border-white/10" />
                    </div>

                    <form onSubmit={handleEmailSignIn} className="space-y-4 mb-6">
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
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Mot de passe</Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-secondary hover:text-secondary/80 transition-colors"
                                >
                                    Mot de passe oublié ?
                                </Link>
                            </div>
                            <PasswordInput
                                id="password"
                                autoComplete="current-password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-12 rounded-xl"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading !== null}
                            className="w-full h-12 rounded-xl text-base font-bold bg-secondary text-primary hover:bg-secondary/90"
                        >
                            {isLoading === "email" ? (
                                <IconLoader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                "Se connecter"
                            )}
                        </Button>
                    </form>

                    <p className="text-xs text-muted-foreground text-center mb-6">
                        Vous aviez un compte Google ou Apple ? Connectez-vous
                        avec Google, ou utilisez « mot de passe oublié » avec
                        votre email pour définir un mot de passe.
                    </p>

                    <div className="pt-6 border-t border-white/10 text-center">
                        <p className="text-sm text-muted-foreground">
                            Nouveau sur Benin Events ?{" "}
                            <Link
                                href={`/sign-up${redirectUrl !== "/dashboard" ? `?redirect_url=${encodeURIComponent(redirectUrl)}` : ""}`}
                                className="text-secondary font-bold hover:text-secondary/80 transition-colors underline decoration-2 underline-offset-4"
                            >
                                Créer un compte
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm text-muted-foreground/60 hover:text-foreground transition-colors font-medium hover:tracking-wide duration-300"
                    >
                        ← Retour à l'accueil
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginContent />
        </Suspense>
    );
}
