import type { CSSProperties } from "react";

// ─────────────────────────────────────────────
// Couleurs — dérivées des tokens réels de src/app/globals.css
// (oklch convertis en hex, mode clair — les clients mail ne
// supportent pas prefers-color-scheme de façon fiable).
// Les teintes de statut (succès/attente/info/danger) reprennent
// les mêmes classes Tailwind déjà utilisées dans le dashboard
// (ex. src/app/admin/payouts, src/app/admin/requests).
// ─────────────────────────────────────────────

export const COLORS = {
    background: "#f5f5f5", // --muted
    card: "#ffffff", // --card
    foreground: "#0a0a0a", // --foreground
    mutedForeground: "#737373", // --muted-foreground
    muted: "#f5f5f5", // --muted
    border: "#e5e5e5", // --border
    primary: "#3b0458", // --primary
    primaryTint: "#f2ecf6",
    primaryForeground: "#fdfdfd", // --primary-foreground
    secondary: "#faad29", // --secondary
    secondaryTint: "#fdf1dc",
    secondaryForeground: "#000000", // --secondary-foreground
    destructive: "#e7000b", // --destructive
    destructiveForeground: "#ffffff", // --destructive-foreground
    success: "#166534",
    successBg: "#dcfce7",
    warning: "#854d0e",
    warningBg: "#fef9c3",
    info: "#1e40af",
    infoBg: "#dbeafe",
    danger: "#991b1b",
    dangerBg: "#fee2e2",
} as const;

export const FONT_FAMILY =
    'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

// ─────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────

export const body: CSSProperties = {
    backgroundColor: COLORS.background,
    fontFamily: FONT_FAMILY,
    margin: 0,
    padding: 0,
};

export const header: CSSProperties = {
    backgroundColor: COLORS.primary,
    padding: "24px 0",
};

export const logo: CSSProperties = {
    color: COLORS.secondary,
    fontSize: "28px",
    fontWeight: 900,
    margin: 0,
    letterSpacing: "2px",
    textAlign: "center",
};

export const logoSub: CSSProperties = {
    color: "rgba(255,255,255,0.55)",
    fontSize: "11px",
    margin: "2px 0 0",
    letterSpacing: "3px",
    textTransform: "uppercase",
    textAlign: "center",
};

/** Carte "reçu" pleine largeur, collée sous le header (majorité des emails transactionnels). */
export const container: CSSProperties = {
    backgroundColor: COLORS.card,
    maxWidth: "600px",
    margin: "0 auto",
};

/** Carte flottante arrondie, centrée avec marge (digests, invitations, notifications). */
export const containerCard: CSSProperties = {
    backgroundColor: COLORS.card,
    borderRadius: "16px",
    margin: "24px auto",
    maxWidth: "560px",
    padding: "40px 48px",
    border: `1px solid ${COLORS.border}`,
};

export const heroSection: CSSProperties = {
    padding: "40px 40px 32px",
    textAlign: "center",
};

export const section: CSSProperties = {
    padding: "32px 40px",
};

/** Séparateur quasi invisible, pour rythmer sans "trait" visible. */
export const divider: CSSProperties = {
    borderColor: COLORS.background,
    margin: 0,
};

/** Séparateur visible, à l'intérieur des cartes/listes. */
export const innerDivider: CSSProperties = {
    borderColor: COLORS.border,
    margin: "10px 0",
};

// ─────────────────────────────────────────────
// Typographie
// ─────────────────────────────────────────────

export const h1: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "26px",
    fontWeight: 800,
    margin: "0 0 12px",
    lineHeight: 1.3,
};

export const h2: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "17px",
    fontWeight: 700,
    margin: "0 0 16px",
};

export const subtitle: CSSProperties = {
    color: COLORS.mutedForeground,
    fontSize: "15px",
    margin: 0,
    lineHeight: 1.6,
};

export const bodyText: CSSProperties = {
    color: COLORS.mutedForeground,
    fontSize: "14px",
    lineHeight: 1.7,
    margin: 0,
};

// ─────────────────────────────────────────────
// Cartes / listes d'infos
// ─────────────────────────────────────────────

export const card: CSSProperties = {
    backgroundColor: COLORS.muted,
    borderRadius: "12px",
    padding: "20px",
    border: `1px solid ${COLORS.border}`,
};

export const infoLabel: CSSProperties = {
    color: COLORS.mutedForeground,
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    margin: "0 0 2px",
};

export const infoValue: CSSProperties = {
    color: COLORS.foreground,
    fontSize: "14px",
    fontWeight: 600,
    margin: 0,
};

// ─────────────────────────────────────────────
// Badges
// ─────────────────────────────────────────────

export type BadgeTone = "brand" | "gold" | "success" | "warning" | "info" | "danger";

const BADGE_TONES: Record<BadgeTone, { bg: string; fg: string }> = {
    brand: { bg: COLORS.primaryTint, fg: COLORS.primary },
    gold: { bg: COLORS.secondaryTint, fg: "#7a5205" },
    success: { bg: COLORS.successBg, fg: COLORS.success },
    warning: { bg: COLORS.warningBg, fg: COLORS.warning },
    info: { bg: COLORS.infoBg, fg: COLORS.info },
    danger: { bg: COLORS.dangerBg, fg: COLORS.danger },
};

export function badge(tone: BadgeTone): CSSProperties {
    const t = BADGE_TONES[tone];
    return {
        display: "inline-block",
        backgroundColor: t.bg,
        color: t.fg,
        fontSize: "13px",
        fontWeight: 700,
        padding: "6px 16px",
        borderRadius: "999px",
        margin: "0 0 20px",
    };
}

// ─────────────────────────────────────────────
// Boutons
// ─────────────────────────────────────────────

export const ctaButtonPrimary: CSSProperties = {
    backgroundColor: COLORS.primary,
    color: COLORS.primaryForeground,
    fontSize: "14px",
    fontWeight: 700,
    padding: "14px 28px",
    borderRadius: "10px",
    textDecoration: "none",
    display: "inline-block",
};

export const ctaButtonSecondary: CSSProperties = {
    backgroundColor: COLORS.secondary,
    color: COLORS.secondaryForeground,
    fontSize: "14px",
    fontWeight: 700,
    padding: "14px 28px",
    borderRadius: "10px",
    textDecoration: "none",
    display: "inline-block",
};

// ─────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────

export const footer: CSSProperties = {
    backgroundColor: COLORS.muted,
    padding: "24px 40px",
    textAlign: "center",
};

export const footerText: CSSProperties = {
    color: COLORS.mutedForeground,
    fontSize: "12px",
    margin: "0 0 6px",
};

export const footerLink: CSSProperties = {
    color: COLORS.primary,
    fontWeight: 600,
    textDecoration: "underline",
};

export const footerCopyright: CSSProperties = {
    color: "#a3a3a3",
    fontSize: "11px",
    margin: "12px 0 0",
};
