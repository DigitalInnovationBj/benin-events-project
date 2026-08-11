import crypto from "crypto";

// Même principe que le token de désinscription newsletter (src/lib/newsletter.ts),
// mais signé sur l'adresse email (les contacts externes n'ont pas de userId).
function secret(): string {
    return `campaign-unsub:${process.env.CRON_SECRET ?? ""}`;
}

export function campaignUnsubscribeToken(email: string): string {
    return crypto
        .createHmac("sha256", secret())
        .update(email.trim().toLowerCase())
        .digest("hex")
        .slice(0, 32);
}

export function verifyCampaignUnsubscribeToken(email: string, token: string): boolean {
    if (!process.env.CRON_SECRET) return false;
    const expected = campaignUnsubscribeToken(email);
    try {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
    } catch {
        return false;
    }
}

export function buildCampaignUnsubscribeUrl(appUrl: string, email: string): string {
    return `${appUrl}/api/campaign/unsubscribe?e=${encodeURIComponent(email)}&t=${campaignUnsubscribeToken(email)}`;
}

// ─────────────────────────────────────────────
// Parsing / validation des adresses externes
// ─────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Découpe un texte collé (retours à la ligne, virgules, points-virgules) en adresses valides et dédupliquées. */
export function parseEmailList(raw: string): string[] {
    const found = raw
        .split(/[\s,;]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => EMAIL_RE.test(s));
    return Array.from(new Set(found));
}
