import crypto from "crypto";

const BASE_URL = "https://pay.genius.ci/api/v1/merchant";

async function request(path: string, options?: RequestInit) {
    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            "X-API-Key": process.env.GENIUSPAY_API_KEY!,
            "X-API-Secret": process.env.GENIUSPAY_API_SECRET!,
            "Content-Type": "application/json",
            ...(options?.headers ?? {}),
        },
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(
            data?.error?.message ?? `GeniusPay error ${res.status}`,
        );
    }

    return data;
}

export interface CreatePaymentPayload {
    amount: number;
    currency?: string;
    description?: string;
    customer?: {
        name?: string;
        email?: string;
        phone?: string;
    };
    success_url: string;
    error_url: string;
    metadata?: Record<string, string | number>;
}

export interface GeniusPayPaymentResponse {
    success: boolean;
    data: {
        id: number;
        reference: string;
        amount: number;
        fees: number;
        net_amount: number;
        status: string;
        checkout_url: string;
        payment_url: string;
        environment: string;
        metadata: Record<string, string | number>;
    };
}

export async function createPayment(
    payload: CreatePaymentPayload,
): Promise<GeniusPayPaymentResponse> {
    return request("/payments", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function getPayment(reference: string) {
    return request(`/payments/${reference}`);
}

export function verifyWebhookSignature(
    signature: string,
    timestamp: string,
    rawBody: string,
): boolean {
    const secret = process.env.GENIUSPAY_WEBHOOK_SECRET;
    if (!secret) return false;

    const data = `${timestamp}.${rawBody}`;
    const expected = crypto
        .createHmac("sha256", secret)
        .update(data)
        .digest("hex");

    // Comparer les hex strings encodés en UTF-8 pour garantir
    // des buffers de même longueur et éviter les erreurs timingSafeEqual
    try {
        return crypto.timingSafeEqual(
            Buffer.from(expected),
            Buffer.from(signature),
        );
    } catch {
        return false;
    }
}
