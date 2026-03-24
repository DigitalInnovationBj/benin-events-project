"use client";

import { useState, useEffect } from "react";
import { useSignIn, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import {
    IconBrandGoogleFilled,
    IconBrandAppleFilled,
    IconMail,
    IconLock,
} from "@tabler/icons-react";
import { toast } from "sonner";

export default function LoginPage() {
    const { isLoaded, signIn, setActive } = useSignIn();
    const { isSignedIn, isLoaded: userLoaded } = useUser();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSocialLoading, setIsSocialLoading] = useState<
        "google" | "apple" | null
    >(null);
    const [error, setError] = useState<string | null>(null);

    // Redirect if user is already signed in
    useEffect(() => {
        if (userLoaded && isSignedIn) {
            router.push("/dashboard/profile");
        }
    }, [userLoaded, isSignedIn, router]);

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded || !signIn) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await signIn.create({
                identifier: email,
                password,
            });

            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
                router.push("/dashboard/profile");
                toast.success("Bon retour !");
            } else {
                console.error(result);
                toast.error(
                    "Échec de la connexion. Veuillez vérifier vos identifiants.",
                );
            }
        } catch (err: any) {
            const errorMessage =
                err?.errors?.[0]?.message || "Erreur lors de la connexion";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialSignIn = async (
        strategy: "oauth_google" | "oauth_apple",
    ) => {
        if (!isLoaded || !signIn) return;

        setIsSocialLoading(strategy === "oauth_google" ? "google" : "apple");
        setError(null);

        try {
            await signIn.authenticateWithRedirect({
                strategy,
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/dashboard/profile",
            });
        } catch (err: any) {
            const errorMessage =
                err?.errors?.[0]?.message || "Erreur lors de la connexion";
            setError(errorMessage);
            toast.error(errorMessage);
            setIsSocialLoading(null);
        }
    };

    if (!userLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isSignedIn) return null;

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-background py-12 px-4">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20 animate-pulse -z-10" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20 animate-pulse -z-10" />

            {/* Main Container */}
            <div className="relative z-10 w-full max-w-md mx-auto">
                <div className="bg-white/5 dark:bg-slate-950/40 backdrop-blur-xl backdrop-saturate-150 border border-white/10 dark:border-slate-800/30 rounded-3xl p-8 sm:p-10 shadow-2xl">
                    <div className="text-center mb-8">
                        <Link
                            href="/"
                            className="flex items-center justify-center mb-6 group"
                        >
                            <div className="relative w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-primary/20 transition-transform group-hover:scale-110">
                                <span className="text-2xl font-bold text-primary">
                                    S
                                </span>
                            </div>
                        </Link>
                        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Connexion
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Accédez à votre espace sécurisé
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-2xl flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                            <p className="text-sm text-destructive font-medium">
                                {error}
                            </p>
                        </div>
                    )}

                    <div className="space-y-4 mb-8">
                        <Button
                            onClick={() => handleSocialSignIn("oauth_google")}
                            disabled={isSocialLoading !== null || isLoading}
                            variant="outline"
                            className="w-full border-white/10 hover:bg-white/5 h-12 rounded-xl text-base font-medium transition-all"
                        >
                            {isSocialLoading === "google" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <IconBrandGoogleFilled className="mr-2 h-5 w-5" />{" "}
                                    Continuer avec Google
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={() => handleSocialSignIn("oauth_apple")}
                            disabled={isSocialLoading !== null || isLoading}
                            variant="outline"
                            className="w-full border-white/10 hover:bg-white/5 h-12 rounded-xl text-base font-medium transition-all"
                        >
                            {isSocialLoading === "apple" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <IconBrandAppleFilled className="mr-2 h-5 w-5" />{" "}
                                    Continuer avec Apple
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="relative mb-8 text-center">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <span className="relative bg-background px-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                            Ou par email
                        </span>
                    </div>

                    <form onSubmit={handleEmailSignIn} className="space-y-5">
                        <div className="space-y-2">
                            <Label
                                htmlFor="email"
                                className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 px-1"
                            >
                                <IconMail className="w-3.5 h-3.5" /> Adresse
                                email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/50 transition-all placeholder:text-muted-foreground/30"
                                required
                                disabled={isLoading || isSocialLoading !== null}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <Label
                                    htmlFor="password"
                                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
                                >
                                    <IconLock className="w-3.5 h-3.5" /> Mot de
                                    passe
                                </Label>
                                <Link
                                    href="/forgot-password"
                                    title="Oublié ?"
                                    className="text-[10px] font-bold text-primary/70 hover:text-primary transition-colors uppercase tracking-widest"
                                >
                                    Oublié ?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/50 transition-all"
                                required
                                disabled={isLoading || isSocialLoading !== null}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 mt-4 active:scale-[0.98] transition-transform"
                            disabled={isLoading || isSocialLoading !== null}
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                "Se connecter"
                            )}
                        </Button>
                    </form>

                    <div className="mt-10 pt-6 border-t border-white/10 text-center">
                        <p className="text-sm text-muted-foreground">
                            Nouveau ici ?{" "}
                            <Link
                                href="/sign-up"
                                className="text-primary font-bold hover:underline"
                            >
                                Créer un compte
                            </Link>
                        </p>
                    </div>
                </div>
                <div className="mt-8 text-center">
                    <Link
                        href="/"
                        className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors font-medium"
                    >
                        ← Retour à l'accueil
                    </Link>
                </div>
            </div>
        </div>
    );
}
