// Module client-safe (aucune dépendance Node) — séparé de src/lib/feexpay.ts
// (qui importe `crypto` et ne peut donc pas être importé depuis un composant client).

export type FeexpayCountryCode = "BJ" | "TG" | "CI" | "CG" | "SN" | "BF" | "ML";

export const NETWORKS = [
    { slug: "mtn", label: "MTN", country: "Bénin", countryCode: "BJ", dialCode: "229" },
    { slug: "moov", label: "Moov", country: "Bénin", countryCode: "BJ", dialCode: "229" },
    { slug: "celtiis_bj", label: "Celtiis", country: "Bénin", countryCode: "BJ", dialCode: "229" },
    { slug: "togocom_tg", label: "Togocom", country: "Togo", countryCode: "TG", dialCode: "228" },
    { slug: "moov_tg", label: "Moov", country: "Togo", countryCode: "TG", dialCode: "228" },
    { slug: "mtn_ci", label: "MTN", country: "Côte d'Ivoire", countryCode: "CI", dialCode: "225" },
    { slug: "moov_ci", label: "Moov", country: "Côte d'Ivoire", countryCode: "CI", dialCode: "225" },
    { slug: "orange_ci", label: "Orange", country: "Côte d'Ivoire", countryCode: "CI", dialCode: "225" },
    { slug: "wave_ci", label: "Wave", country: "Côte d'Ivoire", countryCode: "CI", dialCode: "225" },
    { slug: "mtn_cg", label: "MTN", country: "Congo Brazzaville", countryCode: "CG", dialCode: "242" },
    { slug: "orange_sn", label: "Orange", country: "Sénégal", countryCode: "SN", dialCode: "221" },
    { slug: "wave_sn", label: "Wave", country: "Sénégal", countryCode: "SN", dialCode: "221" },
    { slug: "free_sn", label: "Free", country: "Sénégal", countryCode: "SN", dialCode: "221" },
    { slug: "moov_bf", label: "Moov", country: "Burkina Faso", countryCode: "BF", dialCode: "226" },
    { slug: "orange_bf", label: "Orange", country: "Burkina Faso", countryCode: "BF", dialCode: "226" },
    { slug: "wave_bf", label: "Wave", country: "Burkina Faso", countryCode: "BF", dialCode: "226" },
    { slug: "orange_ml", label: "Orange", country: "Mali", countryCode: "ML", dialCode: "223" },
    { slug: "mobicash_ml", label: "Mobicash", country: "Mali", countryCode: "ML", dialCode: "223" },
] as const;

export type FeexpayNetwork = (typeof NETWORKS)[number]["slug"];

const NETWORK_SLUGS = new Set<string>(NETWORKS.map((n) => n.slug));

export function isValidNetwork(slug: string): slug is FeexpayNetwork {
    return NETWORK_SLUGS.has(slug);
}

export function getNetwork(slug: string) {
    return NETWORKS.find((n) => n.slug === slug);
}

export interface FeexpayCountry {
    code: FeexpayCountryCode;
    label: string;
    dialCode: string;
}

export const COUNTRIES: FeexpayCountry[] = Array.from(
    new Map(
        NETWORKS.map((n) => [n.countryCode, { code: n.countryCode, label: n.country, dialCode: n.dialCode }]),
    ).values(),
);

const COUNTRY_CODES = new Set<string>(COUNTRIES.map((c) => c.code));

export function isValidCountryCode(code: string): code is FeexpayCountryCode {
    return COUNTRY_CODES.has(code);
}

export const DEFAULT_COUNTRY_CODE: FeexpayCountryCode = "BJ";

export function getNetworksByCountry(countryCode: string) {
    return NETWORKS.filter((n) => n.countryCode === countryCode);
}

// Longueur du numéro local (sans indicatif pays) attendue par pays. Le
// Bénin (10, préfixe "01") et la Côte d'Ivoire (10, réforme 2021) ont changé
// de plan de numérotation récemment ; les autres gardent le format à 8/9
// chiffres classique en Afrique de l'Ouest/Centrale francophone.
const LOCAL_NUMBER_LENGTH: Partial<Record<FeexpayCountryCode, number>> = {
    BJ: 10,
    CI: 10,
    CG: 9,
    SN: 9,
    TG: 8,
    BF: 8,
    ML: 8,
};

export function isValidLocalNumber(digits: string, countryCode: string): boolean {
    const expected = LOCAL_NUMBER_LENGTH[countryCode as FeexpayCountryCode];
    return expected ? digits.length === expected : digits.length >= 8;
}
