/**
 * Villes du Bénin proposées à la saisie et utilisées pour filtrer les
 * évènements.
 *
 * `Event.location` reste une adresse en texte libre ; `Event.city` stocke le
 * slug ci-dessous. Auparavant, la page d'accueil comptait les évènements par
 * ville en chargeant toutes les lignes puis en filtrant en JS sur `location`,
 * et les liens « par ville » pointaient vers une recherche plein texte
 * approximative (`/events?q=Cotonou`).
 */

export type City = { slug: string; name: string };

export const CITIES: readonly City[] = [
    { slug: "cotonou", name: "Cotonou" },
    { slug: "porto-novo", name: "Porto-Novo" },
    { slug: "parakou", name: "Parakou" },
    { slug: "abomey-calavi", name: "Abomey-Calavi" },
    { slug: "ouidah", name: "Ouidah" },
    { slug: "abomey", name: "Abomey" },
    { slug: "bohicon", name: "Bohicon" },
    { slug: "natitingou", name: "Natitingou" },
    { slug: "djougou", name: "Djougou" },
    { slug: "lokossa", name: "Lokossa" },
] as const;

const CITY_SLUGS = new Set(CITIES.map((c) => c.slug));

export function isCitySlug(value: string): boolean {
    return CITY_SLUGS.has(value);
}

export function getCityName(slug: string): string | null {
    return CITIES.find((c) => c.slug === slug)?.name ?? null;
}

/**
 * Déduit un slug de ville depuis une adresse libre.
 *
 * Utilisé à la saisie d'un évènement et par la migration de backfill.
 * « Abomey-Calavi » doit être testé avant « Abomey » : les villes sont donc
 * comparées du nom le plus long au plus court.
 */
const CITIES_BY_SPECIFICITY = [...CITIES].sort(
    (a, b) => b.name.length - a.name.length,
);

/** Minuscules sans accents, pour comparer « Abomey-Calavi » et « abomey calavi ». */
function normalize(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
}

export function deriveCitySlug(location: string | null): string | null {
    if (!location) return null;

    const haystack = normalize(location);

    for (const city of CITIES_BY_SPECIFICITY) {
        if (haystack.includes(normalize(city.name))) return city.slug;
    }

    return null;
}
