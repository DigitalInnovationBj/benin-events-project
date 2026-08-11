import { resend } from "@/lib/resend";

export function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

type EmailPayload = { from: string; to: string; subject: string; html: string };

/** Envoie des emails par lots de 100 (limite de l'API batch de Resend). */
export async function batchSend(emails: EmailPayload[]) {
    const batches = chunk(emails, 100);
    for (const batch of batches) {
        await resend.batch.send(batch);
    }
}
