import type { Metadata } from "next";
import { ScrollText } from "lucide-react";
import LegalLayout, {
    LegalSection,
    LegalSubSection,
    LegalList,
    LegalHighlight,
} from "@/components/LegalLayout";

export const metadata: Metadata = {
    title: "Conditions Générales d'Utilisation | Benin Events",
    description:
        "Conditions générales d'utilisation de la plateforme Benin Events.",
};

export default function CguPage() {
    return (
        <LegalLayout
            icon={ScrollText}
            badge="CGU"
            title="Conditions Générales d'Utilisation"
            subtitle="Règles régissant l'utilisation de la plateforme Benin Events"
            updatedAt="Avril 2026"
        >
            <LegalHighlight>
                En accédant à la plateforme Benin Events, vous acceptez sans
                réserve les présentes Conditions Générales d'Utilisation (CGU).
                Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser
                la plateforme.
            </LegalHighlight>

            <LegalSection title="Article 1 — Objet">
                <p>
                    Les présentes CGU ont pour objet de définir les conditions
                    et modalités d'utilisation de la plateforme Benin Events,
                    accessible à l'adresse www.beninevents.com, ainsi que les
                    droits et obligations respectifs de la plateforme et de ses
                    utilisateurs.
                </p>
                <p>
                    Benin Events est une plateforme numérique qui permet aux
                    utilisateurs de découvrir des évènements au Bénin,
                    d'interagir avec leur communauté, et aux organisateurs
                    certifiés de publier et gérer leurs évènements.
                </p>
            </LegalSection>

            <LegalSection title="Article 2 — Acceptation des CGU">
                <p>
                    L'utilisation de la plateforme vaut acceptation pleine et
                    entière des présentes CGU. Benin Events se réserve le droit
                    de modifier les CGU à tout moment. Les utilisateurs seront
                    informés des modifications substantielles par e-mail ou
                    notification sur la plateforme. La poursuite de
                    l'utilisation après notification vaut acceptation des
                    nouvelles CGU.
                </p>
            </LegalSection>

            <LegalSection title="Article 3 — Accès à la plateforme">
                <LegalSubSection title="Accès libre">
                    <p>
                        La consultation des évènements, des catégories et des
                        informations générales de Benin Events est accessible
                        sans inscription préalable.
                    </p>
                </LegalSubSection>
                <LegalSubSection title="Accès restreint">
                    <p>
                        Les fonctionnalités suivantes nécessitent un compte
                        utilisateur :
                    </p>
                    <LegalList
                        items={[
                            "Liker, mettre en favori ou partager un évènement",
                            "Acheter des billets",
                            "Publier des évènements (statut organisateur requis)",
                            "Accéder à l'espace Dashboard",
                        ]}
                    />
                </LegalSubSection>
                <LegalSubSection title="Disponibilité">
                    <p>
                        Benin Events s'efforce d'assurer une disponibilité
                        permanente de la plateforme, sans pouvoir garantir une
                        disponibilité ininterrompue. Des maintenances planifiées
                        ou incidents techniques peuvent entraîner des
                        interruptions temporaires de service.
                    </p>
                </LegalSubSection>
            </LegalSection>

            <LegalSection title="Article 4 — Compte utilisateur">
                <LegalSubSection title="Création du compte">
                    <p>
                        L'inscription sur Benin Events est gratuite et ouverte à
                        toute personne physique majeure. L'utilisateur s'engage
                        à fournir des informations exactes et à les maintenir à
                        jour.
                    </p>
                </LegalSubSection>
                <LegalSubSection title="Responsabilité du compte">
                    <p>
                        L'utilisateur est seul responsable de la confidentialité
                        de ses identifiants. Toute utilisation du compte est
                        réputée effectuée par son titulaire. En cas de
                        compromission du compte, l'utilisateur doit en informer
                        immédiatement Benin Events.
                    </p>
                </LegalSubSection>
                <LegalSubSection title="Suspension et résiliation">
                    <p>
                        Benin Events se réserve le droit de suspendre ou de
                        résilier tout compte en cas de violation des présentes
                        CGU, de comportement frauduleux ou de contenu illicite,
                        sans préavis ni indemnité.
                    </p>
                </LegalSubSection>
            </LegalSection>

            <LegalSection title="Article 5 — Publication d'évènements">
                <LegalSubSection title="Statut organisateur">
                    <p>
                        La publication d'évènements est réservée aux
                        utilisateurs ayant obtenu le statut d'organisateur suite
                        à une demande d'accréditation approuvée par l'équipe
                        Benin Events.
                    </p>
                </LegalSubSection>
                <LegalSubSection title="Obligations de l'organisateur">
                    <p>L'organisateur s'engage à :</p>
                    <LegalList
                        items={[
                            "Publier des informations exactes, complètes et à jour sur ses évènements",
                            "Détenir tous les droits nécessaires sur les contenus publiés (images, textes)",
                            "Respecter la législation béninoise en matière d'organisation d'évènements",
                            "Informer les participants de tout changement majeur ou annulation dans les meilleurs délais",
                            "Ne pas publier de contenu trompeur, diffamatoire, illicite ou contraire aux bonnes mœurs",
                        ]}
                    />
                </LegalSubSection>
                <LegalSubSection title="Contenu interdit">
                    <LegalList
                        items={[
                            "Évènements promouvant la violence, la haine ou la discrimination",
                            "Contenu pornographique ou à caractère sexuel explicite",
                            "Activités illégales ou contraires à l'ordre public",
                            "Spam, publicité mensongère ou pratiques commerciales trompeuses",
                        ]}
                    />
                </LegalSubSection>
            </LegalSection>

            <LegalSection title="Article 6 — Billetterie">
                <p>
                    Benin Events met à disposition une infrastructure de
                    billetterie numérique. L'achat d'un billet constitue un
                    contrat entre l'acheteur et l'organisateur de l'évènement.
                    Benin Events agit en tant qu'intermédiaire technique et ne
                    saurait être tenu responsable du bon déroulement des
                    évènements.
                </p>
                <LegalSubSection title="Prix et paiement">
                    <p>
                        Les prix des billets sont fixés par les organisateurs et
                        affichés toutes taxes comprises (TTC). Les paiements
                        sont sécurisés. Toute transaction est définitive sauf
                        annulation de l'évènement par l'organisateur.
                    </p>
                </LegalSubSection>
                <LegalSubSection title="Remboursements">
                    <p>
                        La politique de remboursement est définie par chaque
                        organisateur et indiquée sur la page de l'évènement. En
                        cas d'annulation de l'évènement, les participants ont
                        droit à un remboursement intégral.
                    </p>
                </LegalSubSection>
            </LegalSection>

            <LegalSection title="Article 7 — Propriété intellectuelle">
                <p>
                    L'ensemble des éléments de la plateforme (logo, charte
                    graphique, code, textes éditoriaux) sont la propriété
                    exclusive de Benin Events et protégés par les lois sur la
                    propriété intellectuelle. Toute reproduction sans
                    autorisation expresse est interdite.
                </p>
                <p>
                    Les organisateurs conservent la propriété des contenus
                    qu'ils publient (photos, descriptions) mais accordent à
                    Benin Events une licence mondiale, non exclusive et gratuite
                    d'utilisation à des fins de promotion de la plateforme.
                </p>
            </LegalSection>

            <LegalSection title="Article 8 — Responsabilité">
                <p>
                    Benin Events est un intermédiaire technique qui met en
                    relation des organisateurs et des participants. À ce titre :
                </p>
                <LegalList
                    items={[
                        "Benin Events n'est pas responsable du contenu publié par les organisateurs",
                        "Benin Events n'est pas responsable du déroulement des évènements",
                        "Benin Events n'est pas responsable des dommages résultant d'une utilisation frauduleuse de la plateforme",
                        "La responsabilité de Benin Events est limitée aux seuls dommages directs et prévisibles",
                    ]}
                />
            </LegalSection>

            <LegalSection title="Article 9 — Protection des données personnelles">
                <p>
                    Le traitement des données personnelles des utilisateurs est
                    régi par la Politique de Confidentialité de Benin Events,
                    accessible à l'adresse{" "}
                    <a
                        href="/confidentialite"
                        className="text-secondary hover:underline"
                    >
                        www.beninevents.com/confidentialite
                    </a>
                    , et conforme à la Loi n°2017-20 du 20 avril 2018 portant
                    Code du Numérique en République du Bénin.
                </p>
            </LegalSection>

            <LegalSection title="Article 10 — Droit applicable et juridiction">
                <p>
                    Les présentes CGU sont régies et interprétées conformément
                    au droit béninois, notamment :
                </p>
                <LegalList
                    items={[
                        "La Loi n°2017-20 du 20 avril 2018 portant Code du Numérique en République du Bénin",
                        "Le Code civil de la République du Bénin",
                        "La réglementation de l'APDP en matière de protection des données",
                    ]}
                />
                <p>
                    Tout litige relatif à l'interprétation ou à l'exécution des
                    présentes CGU sera soumis, à défaut de résolution amiable, à
                    la compétence exclusive des tribunaux compétents de Cotonou,
                    République du Bénin.
                </p>
            </LegalSection>
        </LegalLayout>
    );
}
