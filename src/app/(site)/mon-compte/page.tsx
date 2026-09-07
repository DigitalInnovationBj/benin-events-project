"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { setNewsletterOptIn } from "@/actions/user.actions";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
    IconUser,
    IconMail,
    IconCalendar,
    IconLoader2,
} from "@tabler/icons-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default function MonComptePage() {
    const { data: session, isPending } = useSession();

    if (isPending) {
        return (
            <div className="flex items-center justify-center py-24">
                <IconLoader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex items-center justify-center py-24 px-4">
                <div className="w-full max-w-md bg-card border rounded-3xl shadow-sm text-center p-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <IconUser className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2 text-foreground">
                        Non connecté
                    </h1>
                    <p className="text-muted-foreground mb-8">
                        Veuillez vous connecter pour accéder à votre profil.
                    </p>
                    <Button asChild className="w-full h-12 text-lg font-semibold">
                        <Link href="/sign-in?redirect_url=%2Fmon-compte">Se connecter</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const user = session.user;

    return (
        <div className="max-w-3xl mx-auto w-full px-4 py-10 pb-20 space-y-6">
            <div>
                <h1 className="text-4xl font-afo text-foreground">Mon compte</h1>
                <p className="text-muted-foreground mt-1">
                    Gérez vos informations personnelles et vos préférences
                </p>
            </div>

            <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
                <div className="h-24 bg-linear-to-r from-primary/30 to-primary/5 relative">
                    <div className="absolute -bottom-10 left-8">
                        <Avatar className="h-20 w-20 border-4 border-background shadow-md">
                            {user.image && <AvatarImage src={user.image} />}
                            <AvatarFallback className="text-xl bg-secondary text-primary font-bold">
                                {(user.name || user.email).charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>

                <div className="pt-14 pb-6 px-8">
                    <h2 className="text-2xl font-bold text-foreground">
                        {user.name || "Utilisateur"}
                    </h2>
                    <p className="text-primary font-medium">{user.email}</p>
                </div>

                <div className="px-8 pb-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-sm font-semibold flex items-center gap-2">
                                <IconMail className="w-4 h-4 opacity-70" />
                                Adresse email
                            </Label>
                            <div className="px-4 py-3 bg-muted/50 rounded-xl border font-medium text-foreground text-sm">
                                {user.email}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-sm font-semibold flex items-center gap-2">
                                <IconCalendar className="w-4 h-4 opacity-70" />
                                Date d&apos;inscription
                            </Label>
                            <div className="px-4 py-3 bg-muted/50 rounded-xl border font-medium text-foreground text-sm">
                                {new Date(user.createdAt).toLocaleDateString("fr-FR", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <NewsletterPreference
                        initialOptIn={
                            (user as { newsletterOptIn?: boolean }).newsletterOptIn ?? true
                        }
                    />

                    <Separator />

                    <div className="space-y-3">
                        <h3 className="font-bold text-lg text-foreground">
                            Sécurité & accès
                        </h3>
                        <Button asChild variant="outline" className="h-12 rounded-xl">
                            <Link href="/forgot-password">Changer le mot de passe</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Préférence newsletter
// ─────────────────────────────────────────────

function NewsletterPreference({ initialOptIn }: { initialOptIn: boolean }) {
    const [optIn, setOptIn] = useState(initialOptIn);
    const [isSaving, setIsSaving] = useState(false);

    const handleToggle = async (checked: boolean) => {
        setOptIn(checked);
        setIsSaving(true);
        const res = await setNewsletterOptIn(checked);
        setIsSaving(false);
        if (res.error) {
            setOptIn(!checked);
            toast.error(res.error);
        } else {
            toast.success(
                checked
                    ? "Vous recevrez à nouveau nos suggestions d'évènements."
                    : "Vous ne recevrez plus les emails de suggestions.",
            );
        }
    };

    return (
        <div className="space-y-3">
            <h3 className="font-bold text-lg text-foreground">Préférences</h3>
            <div className="flex items-center justify-between gap-4 px-4 py-4 bg-muted/50 rounded-xl border">
                <div className="min-w-0">
                    <p className="font-medium text-foreground">
                        Suggestions d&apos;évènements
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Recevoir les emails des lundis, mercredis et vendredis
                        avec les évènements à venir.
                    </p>
                </div>
                <Switch
                    checked={optIn}
                    onCheckedChange={handleToggle}
                    disabled={isSaving}
                    aria-label="Recevoir les suggestions d'évènements"
                />
            </div>
        </div>
    );
}
