import crypto from "crypto";

/**
 * Client GeniusPay — paiement par carte bancaire (Visa, Mastercard) des
 * billets. Le Mobile Money reste sur FeexPay (lib/feexpay.ts).
 *
 * Variables d'environnement (déjà configurées lors de l'ancienne
 * intégration) : GENIUSPAY_API_KEY, GENIUSPAY_API_SECRET,
 * GENIUSPAY_WEBHOOK_SECRET ; optionnelles : GENIUSPAY_BASE_URL,
 * GENIUSPAY_FEE_PERCENT (frais carte ajoutés au prix, 3 % par défaut).
 */

// HTTPS obligatoire : les clés API circulent dans les en-têtes.
const BASE_URL =
    process.env.GENIUSPAY_BASE_URL?.replace(/\/$/, "") ??
    "https://geniuspay.ci/api/v1/merchant";

/** Taux des frais de carte GeniusPay, en pourcentage. */
export function geniusPayFeePercent(): number {
    const raw = Number(process.env.GENIUSPAY_FEE_PERCENT);
    return Number.isFinite(raw) && raw >= 0 && raw < 50 ? raw : 3;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const key = process.env.GENIUSPAY_API_KEY;
    const secret = process.env.GENIUSPAY_API_SECRET;
    if (!key || !secret) throw new Error("GeniusPay n'est pas configuré.");

    const res = await fetch(`${BASE_URL}${path}`, {
        ...init,
        headers: {
            "X-API-Key": key,
            "X-API-Secret": secret,
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(init?.headers ?? {}),
        },
        cache: "no-store",
    });

    const body = await res.json().catch(() => null);
    if (!res.ok || body?.success === false) {
        console.error(`[GeniusPay] ${init?.method ?? "GET"} ${path} → ${res.status}`, body);
        throw new Error(body?.error?.message ?? body?.message ?? `GeniusPay ${res.status}`);
    }
    return body as T;
}

type PaymentData = {
    reference: string;
    external_reference?: string | null;
    amount: number;
    status: "pending" | "processing" | "completed" | "failed" | "cancelled" | "refunded" | string;
    checkout_url?: string | null;
    payment_url?: string | null;
};

/**
 * Crée un paiement par carte et renvoie l'URL de la page de paiement.
 * `externalReference` (référence de commande) sert aussi de clé
 * d'idempotence : un nouvel essai ne crée pas de second paiement.
 */
export async function createCardPayment(input: {
    amount: number;
    description: string;
    externalReference: string;
    customer: { name?: string; email?: string };
    successUrl: string;
    errorUrl: string;
    metadata?: Record<string, string>;
}): Promise<{ reference: string; redirectUrl: string }> {
    const res = await request<{ data: PaymentData }>("/payments", {
        method: "POST",
        headers: { "Idempotency-Key": input.externalReference },
        body: JSON.stringify({
            amount: input.amount,
            currency: "XOF",
            payment_method: "card",
            description: input.description.slice(0, 500),
            external_reference: input.externalReference,
            customer: input.customer,
            success_url: input.successUrl,
            error_url: input.errorUrl,
            metadata: input.metadata,
        }),
    });

    const redirectUrl = res.data.payment_url || res.data.checkout_url;
    if (!res.data.reference || !redirectUrl) {
        throw new Error("Réponse GeniusPay incomplète.");
    }
    return { reference: res.data.reference, redirectUrl };
}

/** Statut normalisé, aligné sur celui de FeexPay pour la réconciliation. */
export type CardPaymentStatus = "SUCCESSFUL" | "FAILED" | "PENDING";

/** Revérification côté serveur — jamais faire confiance au contenu du webhook. */
export async function getCardPayment(
    reference: string,
): Promise<{ status: CardPaymentStatus; amount: number }> {
    const res = await request<{ data: PaymentData }>(
        `/payments/${encodeURIComponent(reference)}`,
    );
    const s = res.data.status;
    const status: CardPaymentStatus =
        s === "completed" ? "SUCCESSFUL" : s === "failed" || s === "cancelled" ? "FAILED" : "PENDING";
    return { status, amount: Number(res.data.amount) };
}

/**
 * Signature des webhooks : HMAC-SHA256 de `timestamp + "." + corps brut`
 * avec le secret du webhook, comparée en temps constant.
 */
export function verifyWebhookSignature(
    rawBody: string,
    timestamp: string | null,
    signature: string | null,
): boolean {
    const secret = process.env.GENIUSPAY_WEBHOOK_SECRET;
    if (!secret || !timestamp || !signature) return false;

    const expected = crypto
        .createHmac("sha256", secret)
        .update(`${timestamp}.${rawBody}`)
        .digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature.trim());
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}
