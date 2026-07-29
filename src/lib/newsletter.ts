import crypto from "crypto";

// Clé HMAC dérivée de CRON_SECRET avec un préfixe dédié : le token de
// désinscription ne peut pas être confondu avec l'auth des crons.
function secret(): string {
    return `newsletter-unsub:${process.env.CRON_SECRET ?? ""}`;
}

/** Token de désinscription signé pour un utilisateur (lien dans les digests). */
export function unsubscribeToken(userId: string): string {
    return crypto
        .createHmac("sha256", secret())
        .update(userId)
        .digest("hex")
        .slice(0, 32);
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
    if (!process.env.CRON_SECRET) return false;
    const expected = unsubscribeToken(userId);
    try {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
    } catch {
        return false;
    }
}

export function buildUnsubscribeUrl(appUrl: string, userId: string): string {
    return `${appUrl}/api/newsletter/unsubscribe?u=${encodeURIComponent(userId)}&t=${unsubscribeToken(userId)}`;
}
