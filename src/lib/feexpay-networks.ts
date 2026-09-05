// Module client-safe (aucune dépendance Node) — séparé de src/lib/feexpay.ts
// (qui importe `crypto` et ne peut donc pas être importé depuis un composant client).

export const NETWORKS = [
    { slug: "mtn", label: "MTN", country: "Bénin", dialCode: "229" },
    { slug: "moov", label: "Moov", country: "Bénin", dialCode: "229" },
    { slug: "celtiis_bj", label: "Celtiis", country: "Bénin", dialCode: "229" },
] as const;

export type FeexpayNetwork = (typeof NETWORKS)[number]["slug"];

const NETWORK_SLUGS = new Set<string>(NETWORKS.map((n) => n.slug));

export function isValidNetwork(slug: string): slug is FeexpayNetwork {
    return NETWORK_SLUGS.has(slug);
}

export function getNetwork(slug: string) {
    return NETWORKS.find((n) => n.slug === slug);
}

// Depuis la réforme du plan de numérotation (2024), les numéros béninois
// comptent 10 chiffres (préfixe "01" inclus, ex : 0190000000).
export const LOCAL_NUMBER_LENGTH = 10;

export function isValidLocalNumber(digits: string): boolean {
    return digits.length === LOCAL_NUMBER_LENGTH;
}
