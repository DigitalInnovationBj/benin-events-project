import type { Metadata } from "next";
import Header from "@/components/sections/Header";
import Footer from "@/components/sections/Footer";
import { RequestPartnerForm } from "@/components/forms/RequestPartnerForm";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import Link from "next/link";
import { Handshake, Percent, Megaphone, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
    title: "Devenir Partenaire | Benin Events",
    description:
        "Rejoignez le programme Partenaire Benin Events et bénéficiez d'un taux de commission négocié sur vos évènements.",
};

const PERKS = [
    {
        icon: Percent,
        title: "Commission négociée",
        description:
            "Un taux personnalisé sur vos ventes de billets, adapté à votre volume d'activité.",
    },
    {
        icon: TrendingUp,
        title: "Accompagnement dédié",
        description:
            "Notre équipe vous accompagne pour donner le maximum de visibilité à vos évènements.",
    },
    {
        icon: Megaphone,
        title: "Mise en avant",
        description:
            "Vos évènements gagnent en visibilité auprès de la communauté Benin Events.",
    },
];

export default async function DevenirPartenairePage() {
    const sessionUser = await getCurrentUser();

    const dbUser = sessionUser
        ? await prisma.user.findUnique({
              where: { id: sessionUser.id },
              include: { partnerRequests: true },
          })
        : null;

    const isAlreadyPartner =
        dbUser?.partnerCommissionRate !== null &&
        dbUser?.partnerCommissionRate !== undefined;
    const hasPendingRequest = dbUser?.partnerRequests?.some(
        (r) => r.status === "PENDING",
    );

    return (
        <main className="min-h-screen bg-background">
            <Header />

            {/* ── Hero ─────────────────────────────────────────────────── */}
            <div className="border-b bg-card">
                <div className="max-w-6xl mx-auto px-6 py-16 md:px-12 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Handshake className="w-4 h-4 text-secondary" />
                        <span className="text-secondary text-xs font-bold uppercase tracking-widest">
                            Programme Partenaire
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-afo mb-4">
                        Devenez Partenaire Benin Events
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Vous organisez régulièrement des évènements au Bénin ?
                        Rejoignez notre programme partenaire et bénéficiez
                        d&apos;avantages pensés pour faire grandir votre
                        activité avec nous.
                    </p>
                </div>
            </div>

            {/* ── Avantages ────────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-6 md:px-12 py-16">
                <div className="grid sm:grid-cols-3 gap-6 mb-16">
                    {PERKS.map(({ icon: Icon, title, description }) => (
                        <div
                            key={title}
                            className="rounded-3xl border bg-card p-6"
                        >
                            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                                <Icon className="w-5 h-5 text-secondary" />
                            </div>
                            <h3 className="font-bold mb-1">{title}</h3>
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ── Candidature ──────────────────────────────────────── */}
                <div className="max-w-2xl mx-auto">
                    {!sessionUser ? (
                        <div className="rounded-3xl border bg-card p-8 text-center">
                            <h2 className="font-afo text-2xl mb-2">
                                Prêt à candidater ?
                            </h2>
                            <p className="text-muted-foreground text-sm mb-6">
                                Connectez-vous (ou créez un compte) pour
                                soumettre votre candidature en quelques
                                minutes.
                            </p>
                            <Button asChild size="lg" className="rounded-2xl">
                                <Link href="/sign-in?redirect_url=%2Fdevenir-partenaire">
                                    Se connecter pour candidater
                                </Link>
                            </Button>
                        </div>
                    ) : isAlreadyPartner ? (
                        <div className="rounded-3xl border bg-card p-8 text-center">
                            <h2 className="font-afo text-2xl mb-2">
                                Vous êtes déjà Partenaire
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                Votre taux de commission négocié est de{" "}
                                {dbUser?.partnerCommissionRate}%.
                            </p>
                        </div>
                    ) : hasPendingRequest ? (
                        <div className="rounded-3xl border border-primary/20 bg-primary/5 p-8 text-center">
                            <h2 className="font-afo text-2xl mb-2 text-primary">
                                Candidature en cours...
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                Votre candidature au programme Partenaire est
                                actuellement en cours d&apos;examen par nos
                                administrateurs. Vous recevrez un email dès
                                qu&apos;elle sera validée.
                            </p>
                        </div>
                    ) : (
                        <RequestPartnerForm />
                    )}
                </div>
            </div>

            <Footer />
        </main>
    );
}
