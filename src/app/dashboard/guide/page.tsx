import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ComponentType } from "react";
import {
    IconCash,
    IconChartBar,
    IconMessageQuestion,
    IconRocket,
    IconScan,
    IconSpeakerphone,
    IconTicket,
} from "@tabler/icons-react";
import { getCurrentUser } from "@/lib/permissions";
import { getSettings } from "@/actions/settings.actions";
import { getOrganizerChecklist } from "@/lib/organizer-stats";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = { title: "Guide de l'organisateur" };

type Topic = {
    id: string;
    title: string;
    summary: string;
    icon: ComponentType<{ className?: string }>;
    steps: { q: string; a: React.ReactNode }[];
};

/**
 * Guide de l'organisateur : checklist de prise en main, puis une fiche par
 * type d'action. Les encadrés d'aide du tableau de bord renvoient ici via
 * l'ancre de la fiche (#billets, #jour-j…).
 */
export default async function GuidePage() {
    const user = await getCurrentUser();
    if (!user) redirect("/sign-in");

    const isOrganizer = user.role === "ORGANIZER" || user.role === "ADMIN";
    const [checklist, settings] = await Promise.all([
        isOrganizer ? getOrganizerChecklist(user.id) : Promise.resolve(null),
        getSettings(),
    ]);
    const commission = settings.commissionRate;

    const topics: Topic[] = [
        {
            id: "demarrer",
            title: "Démarrer",
            summary: "Créer l'évènement et s'y retrouver",
            icon: IconRocket,
            steps: [
                {
                    q: "Comment créer un évènement ?",
                    a: (
                        <>
                            Cliquez sur « Créer un évènement » en haut du menu.
                            Renseignez le titre, les dates, le lieu, une image et la
                            description.
                            {settings.eventCreationFeeEnabled &&
                                ` La publication demande un paiement de ${settings.eventCreationFee.toLocaleString("fr-FR")} FCFA.`}
                        </>
                    ),
                },
                {
                    q: "Comment est organisée la page d'un évènement ?",
                    a: "En onglets, un par type d'action : Aperçu (chiffres et raccourcis), Billets, Ventes, Entrées (jour J), Équipe (agents), Promotion et Paramètres (modification, annulation, suppression).",
                },
                {
                    q: "Où trouver mes chiffres ?",
                    a: "L'accueil affiche votre prochain évènement, vos revenus, les billets vendus et le montant à reverser. L'onglet Ventes de chaque évènement donne le détail par billet.",
                },
            ],
        },
        {
            id: "billets",
            title: "Billets et pass",
            summary: "Prix, stock, multi-jours, accès conférence",
            icon: IconTicket,
            steps: [
                {
                    q: "Comment créer un billet ?",
                    a: "Onglet Billets, formulaire « Ajouter un billet » : nom, prix (0 pour un billet gratuit), stock optionnel, description des avantages, image et modèle du PDF.",
                },
                {
                    q: "Billet 1 jour, pass 2 jours, pass 3 jours : quelle différence ?",
                    a: "Sans jour coché, le billet donne une seule entrée, quel que soit le jour. Si vous cochez des jours, il devient un pass : il est scanné une fois par jour coché, et refusé les autres jours.",
                },
                {
                    q: "Comment un pass VVIP donne-t-il aussi accès aux conférences ?",
                    a: "Créez un évènement séparé pour les conférences (il peut rester non publié). Sur le billet VVIP, cochez ses jours puis choisissez cet évènement dans « Valable aussi pour un autre évènement ». Les agents des conférences scannent le même QR code.",
                },
                {
                    q: "Puis-je modifier un billet déjà vendu ?",
                    a: "Oui, avec le crayon à côté du billet. Les modifications de prix ne concernent que les ventes suivantes.",
                },
            ],
        },
        {
            id: "ventes",
            title: "Ventes",
            summary: "Commandes, statuts, renvoi des billets",
            icon: IconChartBar,
            steps: [
                {
                    q: "Que signifient les statuts de commande ?",
                    a: "Payée : billets envoyés. En attente : l'acheteur doit valider le paiement Mobile Money sur son téléphone ; sans validation, la commande expire après 20 minutes et les places sont libérées. Échouée : paiement refusé. Remboursée : traitée après une annulation.",
                },
                {
                    q: "Un acheteur n'a pas reçu ses billets",
                    a: (
                        <>
                            Ouvrez{" "}
                            <Link href="/dashboard/commandes" className="text-secondary underline underline-offset-2">
                                Commandes
                            </Link>
                            , retrouvez la commande et cliquez sur « Renvoyer les
                            billets ». Le filtre « Non délivrées » liste les envois en
                            échec.
                        </>
                    ),
                },
                {
                    q: "Comment exporter la liste des participants ?",
                    a: "Onglet Entrées ou Aperçu, bouton « Exporter » : un fichier CSV lisible dans Excel, avec le nom, l'email, le billet et l'état des scans.",
                },
            ],
        },
        {
            id: "jour-j",
            title: "Jour J",
            summary: "Agents, scanner, messages d'erreur",
            icon: IconScan,
            steps: [
                {
                    q: "Comment inviter des agents de contrôle ?",
                    a: "Onglet Équipe : saisissez l'email d'une personne qui a déjà un compte Benin Events. Elle confirme par email, puis voit « Contrôle d'accès » dans son menu.",
                },
                {
                    q: "Comment scanner les billets ?",
                    a: "Menu « Contrôle d'accès », choisissez l'évènement, autorisez la caméra et pointez vers le QR code. Le résultat s'affiche en vert (valide) ou en couleur avec la raison du refus.",
                },
                {
                    q: "Que veulent dire les refus ?",
                    a: "« Déjà utilisé » : billet déjà scanné (aujourd'hui, pour un pass). « Non valable aujourd'hui » : pass présenté un jour non couvert. « Mauvais évènement » : billet d'un autre évènement. « Commande non confirmée » : paiement non abouti.",
                },
                {
                    q: "Comment suivre les entrées ?",
                    a: "Onglet Entrées : nombre d'entrées par jour et, pour aujourd'hui, par billet. Les pass donnant accès à un autre évènement y apparaissent à part.",
                },
            ],
        },
        {
            id: "promotion",
            title: "Promotion",
            summary: "Codes promo, partenaires, mise en avant",
            icon: IconSpeakerphone,
            steps: [
                {
                    q: "Comment fonctionnent les codes promo partenaires ?",
                    a: "Onglet Promotion : créez un partenaire (influenceur, média) avec son code et sa réduction. Vous voyez combien de ventes chaque code apporte.",
                },
                {
                    q: "Qu'est-ce qu'une campagne email ?",
                    a: "Un email d'annonce de l'évènement envoyé à une liste d'adresses que vous collez. Le nombre d'envois par évènement est limité.",
                },
                {
                    q: "Comment mettre mon évènement en vedette ?",
                    a: settings.featuredEventFeeEnabled
                        ? `Onglet Promotion, « Mettre en vedette » : ${settings.featuredEventFee.toLocaleString("fr-FR")} FCFA pour apparaître en tête de la page d'accueil.`
                        : "La mise en vedette est décidée par l'équipe Benin Events. Contactez-nous pour en discuter.",
                },
            ],
        },
        {
            id: "finances",
            title: "Finances",
            summary: "Commission, reversements",
            icon: IconCash,
            steps: [
                {
                    q: "Combien prend Benin Events ?",
                    a:
                        commission > 0
                            ? `Une commission de ${commission} % sur les ventes, déduite au moment du reversement (sauf taux négocié dans le cadre du programme partenaire).`
                            : "La commission est déduite au moment du reversement ; son taux s'affiche dans Finances.",
                },
                {
                    q: "Comment recevoir mon argent ?",
                    a: (
                        <>
                            Dans{" "}
                            <Link href="/dashboard/payout" className="text-secondary underline underline-offset-2">
                                Finances
                            </Link>
                            , renseignez votre moyen de reversement (Mobile Money ou
                            banque), puis demandez un reversement du montant
                            disponible. Vous recevez un email à chaque changement de
                            statut.
                        </>
                    ),
                },
            ],
        },
        {
            id: "faq",
            title: "Questions fréquentes",
            summary: "Annulation, remboursement, contact",
            icon: IconMessageQuestion,
            steps: [
                {
                    q: "Que se passe-t-il si j'annule l'évènement ?",
                    a: "Onglet Paramètres, « Annuler l'évènement ». Il est dépublié, et l'onglet Ventes liste les commandes payées à rembourser : marquez chacune comme remboursée une fois l'argent rendu, l'acheteur est prévenu par email.",
                },
                {
                    q: "Annuler ou supprimer ?",
                    a: "Annuler garde l'historique et le suivi des remboursements. Supprimer retire l'évènement de votre tableau de bord ; à réserver aux évènements sans vente.",
                },
                {
                    q: "Besoin d'aide ?",
                    a: (
                        <>
                            Écrivez-nous depuis la{" "}
                            <Link href="/contact" className="text-secondary underline underline-offset-2">
                                page contact
                            </Link>
                            .
                        </>
                    ),
                },
            ],
        },
    ];

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6 pb-16">
            <div>
                <h1 className="font-afo text-2xl sm:text-3xl">Guide de l&apos;organisateur</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Tout ce qu&apos;il faut pour vendre et contrôler vos billets.
                </p>
            </div>

            {checklist && <OnboardingChecklist steps={checklist} />}

            <nav aria-label="Fiches du guide" className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {topics.map((t) => (
                    <a
                        key={t.id}
                        href={`#${t.id}`}
                        className="rounded-2xl border bg-card p-4 transition-colors hover:border-secondary/60"
                    >
                        <span className="mb-3 flex size-9 items-center justify-center rounded-xl bg-primary text-secondary">
                            <t.icon className="size-5" aria-hidden="true" />
                        </span>
                        <span className="block text-sm font-semibold">{t.title}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{t.summary}</span>
                    </a>
                ))}
            </nav>

            {topics.map((t) => (
                <section key={t.id} id={t.id} className="scroll-mt-20 rounded-2xl border bg-card p-5">
                    <h2 className="flex items-center gap-2 font-afo text-xl">
                        <t.icon className="size-5 text-secondary" aria-hidden="true" />
                        {t.title}
                    </h2>
                    <Accordion type="multiple" className="mt-2">
                        {t.steps.map((s, i) => (
                            <AccordionItem key={i} value={`${t.id}-${i}`}>
                                <AccordionTrigger className="text-left text-sm">{s.q}</AccordionTrigger>
                                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                                    {s.a}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </section>
            ))}
        </div>
    );
}
