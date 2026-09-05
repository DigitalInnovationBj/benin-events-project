import { NextRequest, NextResponse } from "next/server";
import { decodeCallbackInfo, verifyWebhookAuth } from "@/lib/feexpay";
import { reconcileOrderPayment, reconcilePlatformPayment } from "@/lib/payment-reconciliation";
import { revalidatePath } from "next/cache";

// FeexPay ne signe pas ses webhooks en HMAC : la seule protection est l'en-tête
// Authorization configuré dans le dashboard FeexPay + la revérification
// systématique du statut/montant auprès de leur API (jamais le payload brut) —
// c'est reconcileOrderPayment/reconcilePlatformPayment qui s'en chargent,
// partagés avec le polling client (voir src/lib/payment-reconciliation.ts).
export async function POST(req: NextRequest) {
    if (!verifyWebhookAuth(req.headers.get("authorization"))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload: { callback_info?: string };
    try {
        payload = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Piège FeexPay : `reference`/`order_id` à la racine du payload sont
    // l'identifiant DE FEEXPAY, jamais le nôtre — la corrélation avec notre
    // commande locale se fait UNIQUEMENT via callback_info.
    const callbackInfo = payload.callback_info;
    if (!callbackInfo) {
        return NextResponse.json({ error: "Missing callback_info" }, { status: 400 });
    }

    const decoded = decodeCallbackInfo(callbackInfo);
    if (!decoded) {
        console.error("FeexPay webhook: callback_info non reconnu", { callbackInfo });
        return NextResponse.json({ error: "Unrecognized callback_info" }, { status: 400 });
    }

    try {
        if (decoded.kind === "order") {
            await reconcileOrderPayment(decoded.id);
        } else {
            const status = await reconcilePlatformPayment(decoded.id);
            if (status === "COMPLETED") {
                revalidatePath("/dashboard/events");
                revalidatePath("/");
            }
        }
    } catch (err) {
        console.error("FeexPay webhook processing error:", err);
        return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
