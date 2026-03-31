import type { Metadata } from "next";
import { Cookie } from "lucide-react";
import LegalLayout, {
    LegalSection,
    LegalSubSection,
    LegalList,
    LegalHighlight,
} from "@/components/LegalLayout";

export const metadata: Metadata = {
    title: "Politique des cookies | Benin Events",
    description:
        "Tout savoir sur les cookies utilisés par Benin Events et comment gérer vos préférences.",
};

export default function CookiesPage() {
    return (
        <LegalLayout
            icon={Cookie}
            badge="Cookies"
            title="Politique des cookies"
            subtitle="Comment nous utilisons les cookies et comment gérer vos préférences"
            updatedAt="Juillet 2025"
        >
            <LegalSection title="1. Qu'est-ce qu'un cookie ?">
                <p>
                    Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur,
                    smartphone, tablette) lors de votre visite sur un site web. Il permet au site
                    de mémoriser vos préférences, actions et informations de session afin
                    d'améliorer votre expérience de navigation.
                </p>
                <p>
                    Les cookies ne contiennent pas de virus et ne peuvent pas accéder à vos
                    données personnelles stockées sur votre appareil. Leur durée de vie est
                    limitée et ils peuvent être supprimés à tout moment depuis votre navigateur.
                </p>
            </LegalSection>

            <LegalSection title="2. Cookies utilisés sur Benin Events">
                <LegalSubSection title="🛡️ Cookies essentiels — toujours actifs">
                    <p>
                        Ces cookies sont indispensables au fonctionnement de la plateforme.
                        Ils ne peuvent pas être désactivés sans affecter l'expérience
                        utilisateur.
                    </p>
                    <LegalList
                        items={[
                            "__clerk_db_jwt — Authentification Clerk (session sécurisée) — Durée : session",
                            "__session — Maintien de la session utilisateur — Durée : session",
                            "__client_uat — Vérification d'activité du compte — Durée : session",
                            "theme-preference — Mémorisation du thème clair/sombre — Durée : 1 an",
                            "benin-events-cookie-consent — Mémorisation de vos préférences de cookies — Durée : 13 mois",
                        ]}
                    />
                </LegalSubSection>

                <LegalSubSection title="📊 Cookies analytiques — avec votre consentement">
                    <p>
                        Ces cookies nous permettent de mesurer l'audience de la plateforme,
                        d'analyser le comportement des visiteurs et d'améliorer nos services.
                        Aucune donnée à caractère personnel n'est transmise à des tiers
                        à des fins commerciales.
                    </p>
                    <LegalList
                        items={[
                            "Mesure du nombre de visiteurs uniques et de pages vues",
                            "Analyse des parcours de navigation et des pages les plus consultées",
                            "Détection des erreurs techniques et optimisation des performances",
                            "Durée de conservation : 13 mois maximum",
                        ]}
                    />
                </LegalSubSection>

                <LegalSubSection title="🎯 Cookies marketing — avec votre consentement">
                    <p>
                        Ces cookies permettent de vous proposer des contenus personnalisés
                        et des publicités pertinentes en lien avec vos centres d'intérêt.
                    </p>
                    <LegalList
                        items={[
                            "Personnalisation des évènements suggérés",
                            "Mesure d'efficacité des campagnes promotionnelles",
                            "Remarketing sur les réseaux sociaux partenaires",
                            "Durée de conservation : 13 mois maximum",
                        ]}
                    />
                </LegalSubSection>
            </LegalSection>

            <LegalSection title="3. Base légale du dépôt de cookies">
                <LegalList
                    items={[
                        "Cookies essentiels : intérêt légitime (Art. 6.1.f RGPD) — aucun consentement requis",
                        "Cookies analytiques : consentement explicite (Art. 6.1.a RGPD / Loi n°2017-20 Bénin)",
                        "Cookies marketing : consentement explicite (Art. 6.1.a RGPD / Loi n°2017-20 Bénin)",
                    ]}
                />
            </LegalSection>

            <LegalSection title="4. Gérer vos préférences">
                <LegalSubSection title="Via le bandeau Benin Events">
                    <p>
                        Lors de votre première visite, un bandeau de gestion des cookies
                        apparaît en bas de l'écran. Vous pouvez y accepter tous les cookies,
                        les refuser ou personnaliser vos choix par catégorie. Vos préférences
                        sont enregistrées dans votre navigateur et valables 13 mois.
                    </p>
                </LegalSubSection>

                <LegalSubSection title="Via votre navigateur">
                    <p>
                        Vous pouvez configurer votre navigateur pour accepter, refuser ou
                        supprimer les cookies à tout moment. Voici comment procéder sur les
                        principaux navigateurs :
                    </p>
                    <LegalList
                        items={[
                            "Google Chrome : Paramètres › Confidentialité et sécurité › Cookies et autres données de site",
                            "Mozilla Firefox : Paramètres › Vie privée et sécurité › Cookies et données de site",
                            "Safari : Préférences › Confidentialité › Gérer les données du site web",
                            "Microsoft Edge : Paramètres › Confidentialité, recherche et services › Cookies",
                        ]}
                    />
                    <p>
                        Attention : la suppression ou le blocage des cookies essentiels peut
                        altérer le fonctionnement de la plateforme, notamment la connexion
                        à votre compte.
                    </p>
                </LegalSubSection>
            </LegalSection>

            <LegalSection title="5. Cookies tiers">
                <p>
                    Certaines fonctionnalités de Benin Events font appel à des services tiers
                    susceptibles de déposer leurs propres cookies :
                </p>
                <LegalList
                    items={[
                        "Clerk (authentification) — politique disponible sur clerk.com/legal/privacy",
                        "Vercel (hébergement et analytics) — politique disponible sur vercel.com/legal/privacy-policy",
                        "EmailJS (formulaire de contact) — cookies de session uniquement",
                    ]}
                />
                <p>
                    Ces tiers sont soumis à leurs propres politiques de confidentialité.
                    Benin Events n'a pas de contrôle sur les cookies qu'ils déposent.
                </p>
            </LegalSection>

            <LegalSection title="6. Modifications de la politique des cookies">
                <p>
                    Benin Events se réserve le droit de modifier la présente politique des
                    cookies pour refléter les évolutions légales, techniques ou de service.
                    La date de mise à jour est indiquée en haut de cette page.
                </p>
                <p>
                    Pour toute question relative aux cookies, contactez-nous à{" "}
                    <a href="mailto:contact@beninevents.com" className="text-secondary hover:underline">
                        contact@beninevents.com
                    </a>
                    .
                </p>
            </LegalSection>

            <LegalHighlight>
                💡 <strong>Rappel :</strong> Vous pouvez modifier vos préférences de cookies
                à tout moment en cliquant sur le bandeau de gestion qui s'affichera lors de
                votre prochaine visite, ou en supprimant la clé{" "}
                <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                    benin-events-cookie-consent
                </code>{" "}
                de votre localStorage depuis les outils développeur de votre navigateur.
            </LegalHighlight>
        </LegalLayout>
    );
}
