import type { Metadata } from "next";
import {
    IconFileText,
} from "@tabler/icons-react";
import LegalLayout, {
    LegalSection,
    LegalSubSection,
    LegalList,
    LegalHighlight,
} from "@/components/LegalLayout";

export const metadata: Metadata = {
    title: "Mentions légales | Benin Events",
    description: "Mentions légales de la plateforme Benin Events.",
};

export default function MentionsLegalesPage() {
    return (
        <LegalLayout
            icon={IconFileText}
            badge="Légal"
            title="Mentions légales"
            subtitle="Informations légales obligatoires relatives à la plateforme Benin Events"
            updatedAt="Avril 2026"
        >
            <LegalSection title="1. Éditeur du site">
                <p>
                    Le site{" "}
                    <strong className="text-foreground">Benin Events</strong>{" "}
                    est une plateforme numérique dédiée à la découverte, la
                    réservation et l&apos;organisation d&apos;évènements en
                    République du Bénin.
                </p>
                <LegalSubSection title="Coordonnées de l'éditeur">
                    <LegalList
                        items={[
                            "Dénomination : Benin Events",
                            "Siège social : Cotonou, République du Bénin",
                            "Adresse e-mail : contact@beninevents.com",
                            "Site web : www.beninevents.com",
                        ]}
                    />
                </LegalSubSection>
            </LegalSection>

            <LegalSection title="2. Directeur de la publication">
                <p>
                    Le directeur de la publication est le représentant légal de
                    Benin Events. Pour toute question relative au contenu du
                    site, vous pouvez le contacter à l&apos;adresse suivante :{" "}
                    <a
                        href="mailto:contact@beninevents.com"
                        className="text-secondary hover:underline"
                    >
                        contact@beninevents.com
                    </a>
                    .
                </p>
            </LegalSection>

            <LegalSection title="3. Hébergement">
                <p>
                    Le site Benin Events est hébergé par la société Vercel Inc.,
                    dont le siège social est situé au :
                </p>
                <LegalHighlight>
                    <strong>Vercel Inc.</strong>
                    <br />
                    340 Pine Street, Suite 811-12
                    <br />
                    San Francisco, CA 94104, États-Unis
                    <br />
                    Site web :{" "}
                    <a
                        href="https://vercel.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary hover:underline"
                    >
                        www.vercel.com
                    </a>
                </LegalHighlight>
            </LegalSection>

            <LegalSection title="4. Propriété intellectuelle">
                <p>
                    L&apos;ensemble des éléments constituant le site Benin
                    Events (textes, graphismes, logiciels, photographies,
                    images, sons, plans, noms, logos, marques, créations et
                    œuvres protégeables diverses, bases de données) sont la
                    propriété exclusive de Benin Events ou font l&apos;objet
                    d&apos;une autorisation d&apos;utilisation.
                </p>
                <p>
                    Ces éléments sont protégés par les lois relatives à la
                    propriété intellectuelle en vigueur en République du Bénin
                    (Loi n°2017-20 du 20 avril 2018 portant Code du Numérique en
                    République du Bénin) et dans le monde entier.
                </p>
                <p>
                    Toute reproduction, représentation, utilisation ou
                    adaptation, sous quelque forme que ce soit, de tout ou
                    partie de ces éléments, y compris les applications
                    informatiques, sans l&apos;accord préalable et écrit de
                    Benin Events, est strictement interdite et constitue une
                    contrefaçon sanctionnée par les lois en vigueur.
                </p>
            </LegalSection>

            <LegalSection title="5. Contenu généré par les utilisateurs">
                <p>
                    Les organisateurs d&apos;évènements publient du contenu
                    (descriptions, images, informations) sur la plateforme. Ce
                    contenu relève de leur responsabilité exclusive. Benin
                    Events se réserve le droit de supprimer tout contenu
                    contrevenant aux Conditions Générales d&apos;Utilisation ou
                    à la législation en vigueur.
                </p>
            </LegalSection>

            <LegalSection title="6. Liens hypertextes">
                <p>
                    Le site Benin Events peut contenir des liens vers des sites
                    tiers. Ces liens sont fournis à titre informatif uniquement.
                    Benin Events n&apos;exerce aucun contrôle sur le contenu de
                    ces sites et décline toute responsabilité quant aux
                    informations qui y sont publiées.
                </p>
                <p>
                    La création de liens hypertextes vers le site Benin Events
                    est autorisée sous réserve de ne pas porter atteinte à
                    l&apos;image de la plateforme et de ne pas induire en erreur
                    l&apos;internaute sur la nature et l&apos;origine du
                    contenu.
                </p>
            </LegalSection>

            <LegalSection title="7. Droit applicable">
                <p>
                    Les présentes mentions légales sont régies par le droit
                    béninois, notamment par la Loi n°2017-20 du 20 avril 2018
                    portant Code du Numérique en République du Bénin. Tout
                    litige relatif à l&apos;utilisation du site Benin Events
                    sera soumis à la compétence exclusive des tribunaux
                    compétents de Cotonou, République du Bénin.
                </p>
            </LegalSection>
        </LegalLayout>
    );
}
