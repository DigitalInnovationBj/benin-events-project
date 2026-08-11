import { NextRequest } from "next/server";
import { render } from "@react-email/components";
import type { DigestEvent } from "@/emails/event-digest";
import { chunk, batchSend } from "@/lib/mailer";

export { chunk, batchSend };

export const FROM_NEWS = "Benin Events <newsletter@beninevents.com>";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function verifyCronAuth(req: NextRequest): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return false;
    return req.headers.get("authorization") === `Bearer ${secret}`;
}

export function formatEventDate(date: Date): string {
    return date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Porto-Novo",
    });
}

type RawEvent = {
    title: string;
    slug: string;
    startDate: Date;
    location: string | null;
    eventType: "IN_PERSON" | "ONLINE";
    imageUrl: string | null;
    categories: { category: { name: string } }[];
    tickets: { price: number }[];
};

export function toDigestEvent(e: RawEvent): DigestEvent {
    const prices = e.tickets.map((t) => t.price);
    return {
        title: e.title,
        slug: e.slug,
        dateLabel: formatEventDate(e.startDate),
        location: e.location,
        eventType: e.eventType,
        imageUrl: e.imageUrl,
        minPrice: prices.length > 0 ? Math.min(...prices) : 0,
        categories: e.categories.map((ec) => ec.category.name),
    };
}

export async function renderDigestHtml(
    component: React.ReactElement,
): Promise<string> {
    return render(component);
}
