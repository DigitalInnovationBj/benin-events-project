import crypto from "crypto";
import { isValidNetwork, type FeexpayNetwork } from "@/lib/feexpay-networks";

export { NETWORKS, isValidNetwork, getNetwork, isValidLocalNumber, type FeexpayNetwork } from "@/lib/feexpay-networks";

const BASE_URL = "https://api-v2.feexpay.me/api";

export const MIN_AMOUNT_FCFA = 100;

// ─────────────────────────────────────────────
// callback_info — seul champ qui revient inchangé dans le webhook FeexPay.
// Encodage : "order:<id>" / "platform:<id>" pour router le webhook.
// ─────────────────────────────────────────────

export type CallbackKind = "order" | "platform";

export function encodeCallbackInfo(kind: CallbackKind, id: string): string {
    return `${kind}:${id}`;
}

export function decodeCallbackInfo(
    callbackInfo: string,
): { kind: CallbackKind; id: string } | null {
    const idx = callbackInfo.indexOf(":");
    if (idx === -1) return null;
    const kind = callbackInfo.slice(0, idx);
    const id = callbackInfo.slice(idx + 1);
    if ((kind !== "order" && kind !== "platform") || !id) return null;
    return { kind, id };
}

// ─────────────────────────────────────────────
// Client HTTP
// ─────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${process.env.FEEXPAY_API_KEY}`,
            "Content-Type": "application/json",
            ...(options?.headers ?? {}),
        },
    });

    const rawText = await res.text();
    const data = rawText ? (tryParse(rawText) as { message?: string; error?: string } | null) : null;

    if (!res.ok) {
        console.error(
            `[FeexPay] ${options?.method ?? "GET"} ${path} → ${res.status}`,
            "request body:", options?.body,
            "response body:", rawText,
        );
        throw new Error(
            data?.message || data?.error || `FeexPay error ${res.status}: ${rawText.slice(0, 200)}`,
        );
    }

    return data as T;
}

function tryParse(text: string): unknown {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

export type FeexpayStatus = "PENDING" | "SUCCESSFUL" | "FAILED";

export interface CreatePaymentInput {
    amount: number;
    /** Numéro complet (indicatif + numéro local, chiffres uniquement, sans +). */
    phoneNumber: string;
    network: FeexpayNetwork;
    /** Encodé via encodeCallbackInfo — seul champ qui revient dans le webhook. */
    callbackInfo: string;
    description?: string;
}

export interface CreatePaymentResponse {
    reference: string;
    message: string;
    status: FeexpayStatus;
    amount: number;
    callback_info: string;
    phoneNumber: string;
}

export async function createPayment(
    input: CreatePaymentInput,
): Promise<CreatePaymentResponse> {
    if (input.amount < MIN_AMOUNT_FCFA) {
        throw new Error(`Le montant minimum est de ${MIN_AMOUNT_FCFA} FCFA.`);
    }
    if (!isValidNetwork(input.network)) {
        throw new Error("Opérateur mobile money invalide.");
    }

    return request<CreatePaymentResponse>(
        `/transactions/public/requesttopay/${input.network}`,
        {
            method: "POST",
            body: JSON.stringify({
                shop: process.env.FEEXPAY_SHOP_ID,
                amount: input.amount,
                phoneNumber: input.phoneNumber,
                description: input.description,
                callback_info: input.callbackInfo,
            }),
        },
    );
}

export interface FeexpayStatusResponse {
    reference: string;
    amount: number;
    phoneNumber: string;
    status: FeexpayStatus;
    reason: string | null;
}

/** Revérification côté serveur — jamais faire confiance au statut brut du webhook. */
export async function getPaymentStatus(
    providerReference: string,
): Promise<FeexpayStatusResponse> {
    return request<FeexpayStatusResponse>(
        `/transactions/public/single/status/${providerReference}`,
    );
}

/** Vérifie l'en-tête Authorization du webhook FeexPay (comparaison temps constant). */
export function verifyWebhookAuth(authHeader: string | null): boolean {
    const secret = process.env.FEEXPAY_WEBHOOK_SECRET;
    if (!secret || !authHeader) return false;

    const provided = authHeader.replace(/^Bearer\s+/i, "");
    try {
        const a = Buffer.from(provided);
        const b = Buffer.from(secret);
        return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
        return false;
    }
}
