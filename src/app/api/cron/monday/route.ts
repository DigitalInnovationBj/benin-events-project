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
import { buildUnsubscribeUrl } from "@/lib/newsletter";

// Runs every Monday at 07:00 UTC (08:00 Bénin)
export async function GET(req: NextRequest) {
    if (!verifyCronAuth(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setUTCDate(now.getUTCDate() + 7);
    weekEnd.setUTCHours(22, 59, 59, 999);

    const events = await prisma.event.findMany({
        where: {
            isDeleted: false,
            isPublished: true,
            startDate: { gte: now, lte: weekEnd },
        },
        include: {
            categories: { include: { category: { select: { name: true } } } },
            tickets: { where: { isArchived: false }, select: { price: true } },
        },
        orderBy: { startDate: "asc" },
        take: 10,
    });

    if (events.length === 0) {
        return NextResponse.json({ sent: 0, reason: "no events this week" });
    }

    const digestEvents = events.map(toDigestEvent);

    const users = await prisma.user.findMany({
        where: { newsletterOptIn: true },
        select: { id: true, email: true, name: true },
    });

    const emails = await Promise.all(
        users.map(async (user) => ({
            from: FROM_NEWS,
            to: user.email,
            subject: "📅 Les évènements de la semaine — Benin Events",
            html: await renderDigestHtml(
                React.createElement(EventDigestEmail, {
                    userName: user.name ?? "vous",
                    digestType: "week",
                    events: digestEvents,
                    appUrl: APP_URL,
                    unsubscribeUrl: buildUnsubscribeUrl(APP_URL, user.id),
                }),
            ),
        })),
    );

    await batchSend(emails);

    return NextResponse.json({ sent: emails.length });
}
