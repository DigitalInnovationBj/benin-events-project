import { NextRequest, NextResponse } from "next/server";
import React from "react";
import prisma from "@/lib/prisma";
import { EventDigestEmail } from "@/emails/event-digest";
import {
    APP_URL,
    FROM_NEWS,
    verifyCronAuth,
    toDigestEvent,
    batchSend,
    renderDigestHtml,
} from "../_lib";

// Runs every Wednesday at 07:00 UTC (08:00 Bénin)
export async function GET(req: NextRequest) {
    if (!verifyCronAuth(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setUTCDate(now.getUTCDate() + 21);

    // ── 1. Upcoming events with categories ────────────────────────────────────
    const upcomingEvents = await prisma.event.findMany({
        where: { isDeleted: false, startDate: { gte: now, lte: cutoff } },
        include: {
            categories: { include: { category: { select: { name: true } } } },
            tickets: { select: { price: true } },
        },
        orderBy: { startDate: "asc" },
        take: 100,
    });

    if (upcomingEvents.length === 0) {
        return NextResponse.json({ sent: 0, reason: "no upcoming events" });
    }

    // ── 2. Build event → categoryId set ──────────────────────────────────────
    const eventCatIds = new Map<string, Set<string>>(
        upcomingEvents.map((e) => [
            e.id,
            new Set(e.categories.map((ec) => ec.categoryId)),
        ]),
    );

    const featuredFallback = upcomingEvents
        .filter((e) => e.isFeatured)
        .slice(0, 4)
        .map(toDigestEvent);
    const genericFallback = upcomingEvents.slice(0, 4).map(toDigestEvent);

    // ── 3. User preferences : favorites + completed orders ────────────────────
    const [favorites, orders] = await Promise.all([
        prisma.favorite.findMany({
            select: {
                userId: true,
                event: { select: { categories: { select: { categoryId: true } } } },
            },
        }),
        prisma.order.findMany({
            where: { status: "COMPLETED" },
            select: {
                userId: true,
                event: { select: { categories: { select: { categoryId: true } } } },
            },
        }),
    ]);

    const userPrefs = new Map<string, Set<string>>();
    const addPrefs = (userId: string, catIds: string[]) => {
        if (!userPrefs.has(userId)) userPrefs.set(userId, new Set());
        catIds.forEach((id) => userPrefs.get(userId)!.add(id));
    };

    favorites.forEach((f) =>
        addPrefs(f.userId, f.event.categories.map((c) => c.categoryId)),
    );
    orders.forEach((o) => {
        if (o.userId) addPrefs(o.userId, o.event.categories.map((c) => c.categoryId));
    });

    // ── 4. Per-user recommendations ───────────────────────────────────────────
    const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true },
    });

    const emails = await Promise.all(
        users.map(async (user) => {
            const prefs = userPrefs.get(user.id);

            let recommended;
            if (prefs && prefs.size > 0) {
                const scored = upcomingEvents
                    .map((e) => ({
                        event: e,
                        score: [...(eventCatIds.get(e.id) ?? [])].filter((id) =>
                            prefs.has(id),
                        ).length,
                    }))
                    .filter((x) => x.score > 0)
                    .sort(
                        (a, b) =>
                            b.score - a.score ||
                            a.event.startDate.getTime() - b.event.startDate.getTime(),
                    )
                    .slice(0, 4)
                    .map((x) => toDigestEvent(x.event));

                recommended = scored.length > 0
                    ? scored
                    : featuredFallback.length > 0
                      ? featuredFallback
                      : genericFallback;
            } else {
                recommended = featuredFallback.length > 0
                    ? featuredFallback
                    : genericFallback;
            }

            return {
                from: FROM_NEWS,
                to: user.email,
                subject: "🎯 Des évènements sélectionnés pour vous — Benin Events",
                html: await renderDigestHtml(
                    React.createElement(EventDigestEmail, {
                        userName: user.name ?? "vous",
                        digestType: "recommendations",
                        events: recommended,
                        appUrl: APP_URL,
                    }),
                ),
            };
        }),
    );

    await batchSend(emails);

    return NextResponse.json({ sent: emails.length });
}
