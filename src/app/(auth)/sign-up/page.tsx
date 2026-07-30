"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { IconBrandGoogleFilled } from "@tabler/icons-react";
import { toast } from "sonner";

function SignUpContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect_url") ?? "/dashboard";

    const { data: session, isPending } = useSession();

    const [name, setName] = useState("");
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
                <Loader2 className="h-8 w-8 animate-spin text-secondary" />
            </div>
        );
    }

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 8) {
            setError("Le mot de passe doit contenir au moins 8 caractères.");
            return;
        }

        setIsLoading("email");
        setError(null);

        const normalizedEmail = email.trim().toLowerCase();
        const { error: err } = await authClient.signUp.email({
            name: name.trim(),
            email: normalizedEmail,
            password,
        });

        if (err) {
            const message =
                err.status === 422
                    ? "Un compte existe déjà avec cet email."
                    : (err.message ?? "Erreur lors de la création du compte");
            setError(message);
            toast.error(message);
            setIsLoading(null);
            return;
        }

        // Un OTP de vérification a été envoyé automatiquement (sendVerificationOnSignUp)
        toast.success("Compte créé ! Vérifiez votre boîte mail.");
        router.push(
            `/verify-email?email=${encodeURIComponent(normalizedEmail)}&redirect_url=${encodeURIComponent(redirectUrl)}`,
        );
    };

    const handleGoogleSignUp = async () => {
        setIsLoading("google");
        setError(null);

        const { error: err } = await authClient.signIn.social({
            provider: "google",
            callbackURL: redirectUrl,
        });

        if (err) {
            const message = err.message ?? "Erreur lors de l'inscription Google";
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
                            Créer un compte
                        </h1>
                        <p className="text-sm">
                            Rejoignez Benin Events pour découvrir et réserver
                            vos évènements
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                            <p className="text-sm text-destructive font-medium">
                                {error}
                            </p>
                        </div>
                    )}

                    <Button
                        onClick={handleGoogleSignUp}
                        disabled={isLoading !== null}
                        variant="outline"
                        className="w-full overflow-hidden group border-white/10 dark:hover:bg-white/5 hover:border-secondary/50 h-14 rounded-xl text-base font-medium transition-all duration-300 mb-6"
                    >
                        {isLoading === "google" ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
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

                    <form onSubmit={handleEmailSignUp} className="space-y-4 mb-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom complet</Label>
                            <Input
                                id="name"
                                type="text"
                                autoComplete="name"
                                placeholder="Votre nom"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="h-12 rounded-xl"
                            />
                        </div>
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
                            <Label htmlFor="password">Mot de passe</Label>
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
                            disabled={isLoading !== null}
                            className="w-full h-12 rounded-xl text-base font-bold bg-secondary text-primary hover:bg-secondary/90"
                        >
                            {isLoading === "email" ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                "Créer mon compte"
                            )}
                        </Button>
                    </form>

                    <div className="pt-6 border-t border-white/10 text-center">
                        <p className="text-sm text-muted-foreground">
                            Déjà un compte ?{" "}
                            <Link
                                href={`/sign-in${redirectUrl !== "/dashboard" ? `?redirect_url=${encodeURIComponent(redirectUrl)}` : ""}`}
                                className="text-secondary font-bold hover:text-secondary/80 transition-colors underline decoration-2 underline-offset-4"
                            >
                                Se connecter
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

export default function SignUpPage() {
    return (
        <Suspense>
            <SignUpContent />
        </Suspense>
    );
}
