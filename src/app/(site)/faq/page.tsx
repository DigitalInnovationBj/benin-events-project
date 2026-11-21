import type { Metadata } from "next";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    IconHelpCircle,
    IconUsers,
    IconSettings,
    IconArrowRight,
} from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "FAQ | Benin Events",
    description:
        "Trouvez les réponses à toutes vos questions sur Benin Events — billetterie, organisation d'évènements, compte et plus.",
};

// ─────────────────────────────────────────────
// Données FAQ (statiques)
// ─────────────────────────────────────────────

const FAQ_GROUPS = [
    {
        id: "participants",
        label: "Participants",
        icon: IconUsers,
        items: [
            {
                id: "p1",
                q: "Comment trouver des évènements au Bénin ?",
                a: "Rendez-vous sur la page Évènements et utilisez les filtres par catégorie, type (présentiel / en ligne) ou date pour affiner votre recherche. Vous pouvez aussi utiliser la barre de recherche accessible depuis la navigation.",
            },
            {
                id: "p2",
                q: "Dois-je créer un compte pour accéder aux évènements ?",
                a: "Non, la consultation des évènements est entièrement libre. Un compte est nécessaire uniquement pour liker, mettre en favori, partager ou acheter des billets.",
            },
            {
                id: "p3",
                q: "Comment fonctionne la billetterie ?",
                a: "Chaque évènement propose un ou plusieurs types de billets avec leur tarif. Il vous suffit de sélectionner votre billet, de procéder au paiement et de recevoir votre confirmation. Votre billet numérique est ensuite accessible depuis votre profil.",
            },
            {
                id: "p4",
                q: "Puis-je annuler ou me faire rembourser mon billet ?",
                a: "La politique de remboursement dépend de chaque organisateur. Consultez les conditions de l'évènement avant l'achat. En cas de litige, notre équipe de support est disponible pour vous accompagner.",
            },
            {
                id: "p5",
                q: "Comment ajouter un évènement à mes favoris ou le partager ?",
                a: 'Sur la page de chaque évènement, vous trouverez des boutons pour liker ❤️, mettre en favori 🔖 et partager 🔗. Ces interactions nécessitent un compte connecté. Le bouton "Partager" génère un lien direct vers l\'évènement.',
            },
        ],
    },
    {
        id: "organisateurs",
        label: "Organisateurs",
        icon: IconSettings,
        items: [
            {
                id: "o1",
                q: "Comment organiser un évènement sur Benin Events ?",
                a: "Connectez-vous à votre espace Dashboard, puis cliquez sur « Créer un évènement ». Remplissez les informations (titre, description, date, lieu, billets, image de couverture) et publiez. Votre évènement sera visible immédiatement sur la plateforme.",
            },
            {
                id: "o2",
                q: "Comment devenir organisateur certifié ?",
                a: 'Depuis votre Dashboard, soumettez une demande d\'accréditation en renseignant le nom de votre organisation, vos contacts et une description de votre activité. Notre équipe examine chaque demande et vous notifie sous 48 heures. Le statut "Organisateur" vous donne accès à des fonctionnalités avancées.',
            },
            {
                id: "o3",
                q: "La publication d'un évènement est-elle gratuite ?",
                a: "Oui, la création et la publication d'un évènement sur Benin Events sont entièrement gratuites. Des options de mise en avant (évènement en vedette) pourront être proposées ultérieurement.",
            },
            {
                id: "o4",
                q: "Comment gérer les billets de mon évènement ?",
                a: "Depuis la page de gestion de votre évènement dans le Dashboard, vous pouvez créer plusieurs types de billets (tarif normal, VIP, gratuit…), définir un stock disponible et modifier les tarifs à tout moment avant la date de l'évènement.",
            },
            {
                id: "o5",
                q: "Comment faire mettre mon évènement en vedette ?",
                a: "La mise en vedette est décidée par l'équipe Benin Events en fonction de la qualité de l'évènement et de son intérêt pour la communauté. Contactez-nous via la page Contact ou sur nos réseaux sociaux pour soumettre votre demande.",
            },
        ],
    },
    {
        id: "compte",
        label: "Compte & Plateforme",
        icon: IconHelpCircle,
        items: [
            {
                id: "c1",
                q: "Comment créer un compte ?",
                a: "Cliquez sur « Se connecter » dans la navigation, puis choisissez « Créer un compte ». Vous pouvez vous inscrire avec une adresse e-mail ou via un compte Google. La création de compte est gratuite et instantanée.",
            },
            {
                id: "c2",
                q: "J'ai oublié mon mot de passe, que faire ?",
                a: "Sur la page de connexion, cliquez sur « Mot de passe oublié ». Entrez votre adresse e-mail et vous recevrez un lien de réinitialisation dans les minutes qui suivent. Si vous ne recevez rien, vérifiez votre dossier spam.",
            },
            {
                id: "c3",
                q: "La plateforme est-elle disponible sur mobile ?",
                a: "Oui, Benin Events est entièrement responsive et fonctionne parfaitement sur smartphone et tablette depuis n'importe quel navigateur. Une application mobile dédiée est en cours de développement.",
            },
            {
                id: "c4",
                q: "Comment contacter le support de Benin Events ?",
                a: "Plusieurs options s'offrent à vous : le formulaire de la page Contact, notre adresse e-mail beninevents.officiel@gmail.com, ou nos réseaux sociaux (Facebook, TikTok, Instagram). Notre équipe répond généralement sous 24 heures ouvrées.",
            },
        ],
    },
];

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function FaqPage() {
    const totalQuestions = FAQ_GROUPS.reduce(
        (acc, g) => acc + g.items.length,
        0,
    );

    return (
        <div className="bg-background">

            {/* ── En-tête ─────────────────────────────────────────────── */}
            <div className="border-b bg-card">
                <div className="max-w-6xl mx-auto px-6 py-8 md:px-12">
                    <div className="flex items-center gap-2 mb-2">
                        <IconHelpCircle className="w-4 h-4 text-secondary" />
                        <span className="text-secondary text-xs font-bold uppercase tracking-widest">
                            Centre d&apos;aide
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-afo mb-1">
                        Questions fréquentes
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {totalQuestions} réponses pour vous aider à tirer le
                        meilleur de Benin Events
                    </p>
                </div>
            </div>

            {/* ── Contenu ─────────────────────────────────────────────── */}
            <div className="max-w-3xl mx-auto px-6 md:px-12 py-16 pb-20 space-y-14">
                {FAQ_GROUPS.map((group) => {
                    const GroupIcon = group.icon;
                    return (
                        <div key={group.id}>
                            {/* Titre du groupe */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                                    <GroupIcon className="w-4.5 h-4.5 text-secondary" />
                                </div>
                                <h2 className="font-afo text-3xl">
                                    {group.label}
                                </h2>
                            </div>

                            {/* Accordéon */}
                            <Accordion
                                type="single"
                                collapsible
                                className="space-y-2"
                            >
                                {group.items.map((item) => (
                                    <AccordionItem
                                        key={item.id}
                                        value={item.id}
                                        className="border rounded-2xl px-5 bg-card data-[state=open]:border-secondary/40 transition-colors"
                                    >
                                        <AccordionTrigger className="text-left font-semibold text-sm py-4 hover:no-underline hover:text-secondary transition-colors [&>svg]:text-secondary">
                                            {item.q}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
                                            {item.a}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    );
                })}

                {/* ── CTA bas de page ─────────────────────────────────── */}
                <div className="rounded-3xl border bg-card p-8 text-center mt-6">
                    <h3 className="font-afo text-3xl mb-2">
                        Vous n&apos;avez pas trouvé votre réponse ?
                    </h3>
                    <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                        Notre équipe est disponible pour vous aider. Envoyez-nous
                        un message et nous vous répondons sous 24 h.
                    </p>
                    <Button asChild variant="secondary" size="lg" className="rounded-2xl gap-2">
                        <Link href="/contact">
                            Nous contacter <IconArrowRight className="w-4 h-4" />
                        </Link>
                    </Button>
                </div>
            </div>

        </div>
    );
}
