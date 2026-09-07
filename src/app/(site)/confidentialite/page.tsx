import type { Metadata } from "next";
import {
    IconShieldCheck,
} from "@tabler/icons-react";
import LegalLayout, {
    LegalSection,
    LegalSubSection,
    LegalList,
    LegalHighlight,
} from "@/components/LegalLayout";

export const metadata: Metadata = {
    title: "Politique de confidentialité | Benin Events",
    description:
        "Politique de confidentialité et protection des données personnelles de Benin Events.",
};

export default function ConfidentialitePage() {
    return (
        <LegalLayout
            icon={IconShieldCheck}
            badge="Confidentialité"
            title="Politique de confidentialité"
            subtitle="Comment nous collectons, utilisons et protégeons vos données personnelles"
            updatedAt="Avril 2026"
        >
            <LegalSection title="1. Responsable du traitement">
                <p>
                    Le responsable du traitement des données personnelles
                    collectées via la plateforme Benin Events est :
                </p>
                <LegalHighlight>
                    <strong>Benin Events</strong>
                    <br />
                    Cotonou, République du Bénin
                    <br />
                    E-mail :{" "}
                    <a
                        href="mailto:contact@beninevents.com"
                        className="text-secondary hover:underline"
                    >
                        contact@beninevents.com
                    </a>
                </LegalHighlight>
            </LegalSection>

            <LegalSection title="2. Données collectées">
                <LegalSubSection title="Données de compte">
                    <p>
                        Lors de la création d&apos;un compte (par email ou via
                        Google), nous collectons :
                    </p>
                    <LegalList
                        items={[
                            "Adresse e-mail",
                            "Nom et prénom",
                            "Photo de profil (si fournie ou issue d'un compte social)",
                            "Identifiant unique de session",
                        ]}
                    />
                </LegalSubSection>
                <LegalSubSection title="Données d'utilisation">
                    <LegalList
                        items={[
                            "Évènements consultés, likés, mis en favori ou partagés",
                            "Billets achetés et historique de réservations",
                            "Messages envoyés via le formulaire de contact",
                            "Rôle sur la plateforme (utilisateur, organisateur)",
                        ]}
                    />
                </LegalSubSection>
                <LegalSubSection title="Données techniques">
                    <LegalList
                        items={[
                            "Adresse IP (anonymisée)",
                            "Type de navigateur et système d'exploitation",
                            "Pages visitées et durée de visite (si cookies analytiques acceptés)",
                            "Cookies de session et d'authentification",
                        ]}
                    />
                </LegalSubSection>
            </LegalSection>

            <LegalSection title="3. Finalités et bases légales">
                <LegalSubSection title="Exécution du contrat (Art. 6.1.b RGPD)">
                    <LegalList
                        items={[
                            "Gestion des comptes utilisateurs et organisateurs",
                            "Traitement des réservations et billets",
                            "Envoi des confirmations et communications transactionnelles",
                        ]}
                    />
                </LegalSubSection>
                <LegalSubSection title="Intérêt légitime (Art. 6.1.f RGPD)">
                    <LegalList
                        items={[
                            "Sécurité et prévention de la fraude",
                            "Amélioration de la plateforme",
                            "Modération du contenu",
                        ]}
                    />
                </LegalSubSection>
                <LegalSubSection title="Consentement (Art. 6.1.a RGPD / Loi n°2017-20 Bénin)">
                    <LegalList
                        items={[
                            "Cookies analytiques et de mesure d'audience",
                            "Cookies marketing et personnalisation",
                            "Communications promotionnelles par e-mail",
                        ]}
                    />
                </LegalSubSection>
            </LegalSection>

            <LegalSection title="4. Durées de conservation">
                <LegalList
                    items={[
                        "Données de compte : durée de vie du compte + 3 ans après suppression",
                        "Historique des transactions : 10 ans (obligation légale comptable)",
                        "Messages de contact : 3 ans à compter de la dernière interaction",
                        "Cookies essentiels : durée de la session ou 13 mois maximum",
                        "Cookies analytiques : 13 mois maximum",
                        "Logs de sécurité : 12 mois",
                    ]}
                />
            </LegalSection>

            <LegalSection title="5. Destinataires des données">
                <p>
                    Vos données peuvent être transmises aux sous-traitants
                    suivants dans le cadre strict de leurs missions :
                </p>
                <LegalList
                    items={[
                        "Google LLC (connexion via un compte Google, si vous choisissez cette option) — USA",
                        "Vercel Inc. (hébergement de la plateforme) — USA",
                        "Resend (envoi des e-mails transactionnels) — soumis au RGPD",
                        "Neon / PostgreSQL (base de données, y compris les comptes et sessions) — données chiffrées au repos",
                    ]}
                />
                <p>
                    Aucune donnée personnelle n&apos;est vendue à des tiers ni
                    utilisée à des fins commerciales non prévues dans la
                    présente politique.
                </p>
            </LegalSection>

            <LegalSection title="6. Vos droits">
                <p>
                    Conformément au Règlement Général sur la Protection des
                    Données (RGPD) et à la loi béninoise sur la protection des
                    données personnelles, vous disposez des droits suivants :
                </p>
                <LegalList
                    items={[
                        "Droit d'accès : obtenir une copie de vos données personnelles",
                        "Droit de rectification : corriger des données inexactes ou incomplètes",
                        "Droit à l'effacement : supprimer vos données dans certaines conditions",
                        "Droit à la portabilité : recevoir vos données dans un format structuré",
                        "Droit d'opposition : vous opposer à certains traitements",
                        "Droit de limitation : suspendre temporairement un traitement",
                        "Droit de retrait du consentement : à tout moment pour les traitements basés sur le consentement",
                    ]}
                />
                <p>
                    Pour exercer ces droits, contactez-nous à{" "}
                    <a
                        href="mailto:contact@beninevents.com"
                        className="text-secondary hover:underline"
                    >
                        contact@beninevents.com
                    </a>
                    . Nous répondrons dans un délai de 30 jours.
                </p>
                <p>
                    Vous avez également le droit d&apos;introduire une
                    réclamation auprès de l&apos;Autorité de Protection des
                    Données Personnelles (APDP) de la République du Bénin.
                </p>
            </LegalSection>

            <LegalSection title="7. Sécurité des données">
                <p>
                    Benin Events met en œuvre toutes les mesures techniques et
                    organisationnelles appropriées pour protéger vos données
                    contre tout accès non autorisé, perte, destruction ou
                    divulgation :
                </p>
                <LegalList
                    items={[
                        "Chiffrement HTTPS/TLS sur l'ensemble des échanges",
                        "Base de données chiffrée au repos",
                        "Authentification sécurisée : mots de passe hachés, sessions signées, vérification d'email par code",
                        "Accès aux données restreint au personnel habilité",
                        "Audits de sécurité réguliers",
                    ]}
                />
            </LegalSection>

            <LegalSection title="8. Modifications de la politique">
                <p>
                    Benin Events se réserve le droit de modifier la présente
                    politique de confidentialité à tout moment pour
                    l&apos;adapter aux évolutions légales ou aux changements de
                    la plateforme. La date de la dernière mise à jour est
                    indiquée en haut de cette page. En cas de modification
                    substantielle, vous serez notifié par e-mail ou via une
                    notification sur la plateforme.
                </p>
            </LegalSection>
        </LegalLayout>
    );
}
