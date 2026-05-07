"use client";

import { Suspense, useState, useEffect } from "react";
import { useSignUp, useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import {
    IconBrandGoogleFilled,
    IconBrandAppleFilled,
} from "@tabler/icons-react";
import { toast } from "sonner";

function SignUpContent() {
    const { isLoaded, signUp } = useSignUp();
    const { isSignedIn, isLoaded: userLoaded } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect_url") ?? "/dashboard";

    const [isSocialLoading, setIsSocialLoading] = useState<
        "google" | "apple" | null
    >(null);
    const [error, setError] = useState<string | null>(null);

    // Redirect if user is already signed in
    useEffect(() => {
        if (userLoaded && isSignedIn) {
            router.push(redirectUrl);
        }
    }, [userLoaded, isSignedIn, router, redirectUrl]);

    const handleSocialSignUp = async (
        strategy: "oauth_google" | "oauth_apple",
    ) => {
        if (!isLoaded || !signUp) return;

        setIsSocialLoading(strategy === "oauth_google" ? "google" : "apple");
        setError(null);

        try {
            await signUp.authenticateWithRedirect({
                strategy,
                redirectUrl: `/sso-callback?redirect_url=${encodeURIComponent(redirectUrl)}`,
                redirectUrlComplete: redirectUrl,
            });
        } catch (err: any) {
            const errorMessage =
                err?.errors?.[0]?.message || "Erreur lors de l'inscription";
            setError(errorMessage);
            toast.error(errorMessage);
            setIsSocialLoading(null);
        }
    };

    if (!userLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-secondary" />
            </div>
        );
    }

    if (isSignedIn) return null;

    return (
        <section className="min-h-screen flex items-center justify-center overflow-hidden bg-background py-8 px-4">
            <div className="w-full max-w-md mx-auto">
                <div className="bg-primary rounded-4xl p-8 sm:p-10 shadow-2xl transition-all hover:shadow-primary/5">
                    <div className="text-center mb-10">
                        <div className="bg-secondary rounded-xl px-5 py-4 w-fit mx-auto flex items-center justify-center">
                            <span className="text-4xl font-afo text-primary">
                                BE
                            </span>
                        </div>
                        <h1 className="text-4xl mb-3 font-afo text-secondary">
                            Créer un compte
                        </h1>
                        <p className="text-sm">
                            Rejoignez l'expérience Benin Events dès aujourd'hui
                        </p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                            <p className="text-sm text-destructive font-medium">
                                {error}
                            </p>
                        </div>
                    )}

                    <div className="space-y-4 mb-10">
                        <Button
                            onClick={() => handleSocialSignUp("oauth_google")}
                            disabled={isSocialLoading !== null}
                            variant="outline"
                            className="w-full  overflow-hidden group border-white/10 dark:hover:bg-white/5 hover:border-primary/50 h-14 rounded-xl text-base font-medium transition-all duration-300"
                        >
                            {isSocialLoading === "google" ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <IconBrandGoogleFilled className="mr-3 h-6 w-6" />{" "}
                                    S'inscrire avec Google
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={() => handleSocialSignUp("oauth_apple")}
                            disabled={isSocialLoading !== null}
                            variant="outline"
                            className="w-full  overflow-hidden group border-white/10 dark:hover:bg-white/5 hover:border-primary/50 h-14 rounded-xl text-base font-medium transition-all duration-300"
                        >
                            {isSocialLoading === "apple" ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <IconBrandAppleFilled className="mr-3 h-6 w-6" />{" "}
                                    S'inscrire avec Apple
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="pt-6 border-t border-white/10 text-center">
                        <p className="text-sm text-muted-foreground">
                            Vous avez déjà un compte ?{" "}
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
