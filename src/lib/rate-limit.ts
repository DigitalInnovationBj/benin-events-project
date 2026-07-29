// Rate limiter en mémoire (fenêtre fixe), sans dépendance externe.
//
// Limite : sur Vercel, chaque instance serverless a sa propre mémoire — la
// limite est donc appliquée par instance, pas globalement. C'est suffisant
// pour stopper les rafales et les scripts abusifs ; pour une garantie
// stricte multi-instances, remplacer par un store partagé (ex. Upstash).

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Retourne `true` si l'appel est autorisé, `false` si la limite est atteinte.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();

    // Purge des fenêtres expirées pour éviter la croissance mémoire
    if (buckets.size > 5000) {
        for (const [k, b] of buckets) {
            if (b.resetAt < now) buckets.delete(k);
        }
    }

    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt < now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }

    if (bucket.count >= limit) return false;
    bucket.count++;
    return true;
}
