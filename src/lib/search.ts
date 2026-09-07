/**
 * Normalisation du texte pour la recherche d'évènements.
 *
 * La recherche comparait la saisie au titre et à la description bruts : les
 * accents et la casse la faisaient échouer (« conference » ne trouvait pas
 * « Conférence »), et la description étant du HTML, une requête pouvait
 * accidentellement matcher un nom de balise.
 *
 * `Event.searchText` stocke une version normalisée de titre + description,
 * calculée à l'enregistrement ; les requêtes normalisent la saisie de la même
 * façon et comparent les deux.
 */

/** Minuscules, sans accents, espaces normalisés. */
export function normalizeSearch(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFD")
        // Marques diacritiques combinantes (U+0300–U+036F)
        .replace(/[̀-ͯ]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

/** Retire les balises HTML et les entités les plus courantes. */
function stripHtml(html: string): string {
    return html
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&[a-z]+;/gi, " ");
}

/**
 * Construit le contenu indexable d'un évènement.
 *
 * Tronqué : au-delà, une description très longue n'apporte plus de pertinence
 * mais alourdit chaque ligne et chaque comparaison.
 */
export function buildSearchText(
    title: string,
    description: string | null,
    location: string | null = null,
): string {
    const raw = [title, stripHtml(description ?? ""), location ?? ""].join(" ");
    return normalizeSearch(raw).slice(0, 4000);
}
