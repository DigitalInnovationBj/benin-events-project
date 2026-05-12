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

// Runs every Friday at 07:00 UTC (08:00 Bénin)
export async function GET(req: NextRequest) {
    if (!verifyCronAuth(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Samedi 00:00 → Dimanche 23:59 (heure Bénin = UTC+1)
    const now = new Date();
    const saturdayStart = new Date(now);
    saturdayStart.setUTCDate(now.getUTCDate() + 1);
    saturdayStart.setUTCHours(23, 0, 0, 0); // 23h UTC = 00h Bénin

    const sundayEnd = new Date(saturdayStart);
    sundayEnd.setUTCDate(saturdayStart.getUTCDate() + 1);
    sundayEnd.setUTCHours(22, 59, 59, 999); // 22:59 UTC = 23:59 Bénin

    const events = await prisma.event.findMany({
        where: {
            isDeleted: false,
            isPublished: true,
            startDate: { gte: saturdayStart, lte: sundayEnd },
        },
        include: {
            categories: { include: { category: { select: { name: true } } } },
            tickets: { select: { price: true } },
        },
        orderBy: { startDate: "asc" },
        take: 8,
    });

    if (events.length === 0) {
        return NextResponse.json({ sent: 0, reason: "no weekend events" });
    }

    const digestEvents = events.map(toDigestEvent);

    const users = await prisma.user.findMany({
        select: { email: true, name: true },
    });

    const emails = await Promise.all(
        users.map(async (user) => ({
            from: FROM_NEWS,
            to: user.email,
            subject: "🌅 Ce week-end sur Benin Events",
            html: await renderDigestHtml(
                React.createElement(EventDigestEmail, {
                    userName: user.name ?? "vous",
                    digestType: "weekend",
                    events: digestEvents,
                    appUrl: APP_URL,
                }),
            ),
        })),
    );

    await batchSend(emails);

    return NextResponse.json({ sent: emails.length });
}
