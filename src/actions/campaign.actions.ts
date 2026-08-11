"use server";

import React from "react";
import { render } from "@react-email/components";
import { after } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { batchSend } from "@/lib/mailer";
import { buildUnsubscribeUrl } from "@/lib/newsletter";
import { buildCampaignUnsubscribeUrl, parseEmailList } from "@/lib/campaign";
import { EventCampaignEmail } from "@/emails/event-campaign";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const FROM_CAMPAIGN = "Benin Events <newsletter@beninevents.com>";

const MAX_CAMPAIGNS_PER_EVENT = 2;
const COOLDOWN_HOURS = 72;

const createCampaignSchema = z.object({
    eventId: z.string().min(1),
    subject: z.string().min(3, "Le sujet est trop court").max(150, "Le sujet est trop long"),
    message: z.string().min(10, "Le message est trop court"),
    targetPlatformUsers: z.boolean(),
    externalEmails: z.array(z.string()).max(20000, "Liste externe trop volumineuse"),
});

export interface CreateEventCampaignInput {
    eventId: string;
    subject: string;
    message: string;
    targetPlatformUsers: boolean;
    externalEmails: string[];
}

// ─────────────────────────────────────────────
// getCampaignsForEvent — historique + état du cooldown
// ─────────────────────────────────────────────

export async function getCampaignsForEvent(eventId: string) {
    const campaigns = await prisma.eventCampaign.findMany({
        where: { eventId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            subject: true,
            status: true,
            recipientCount: true,
            createdAt: true,
            sentAt: true,
        },
    });

    const remaining = Math.max(0, MAX_CAMPAIGNS_PER_EVENT - campaigns.length);
    let nextAvailableAt: Date | null = null;
    if (remaining > 0 && campaigns.length > 0) {
        const last = campaigns[0].createdAt;
        const availableAt = new Date(last.getTime() + COOLDOWN_HOURS * 3_600_000);
        if (availableAt > new Date()) nextAvailableAt = availableAt;
    }

    return { campaigns, remaining, nextAvailableAt, maxPerEvent: MAX_CAMPAIGNS_PER_EVENT };
}

// ─────────────────────────────────────────────
// createEventCampaign
// ─────────────────────────────────────────────

export async function createEventCampaign(input: CreateEventCampaignInput) {
    try {
        const dbUser = await getCurrentUser();
        if (!dbUser) return { error: "Non authentifié." };
        if (dbUser.role !== "ORGANIZER" && dbUser.role !== "ADMIN") {
            return { error: "Permission refusée." };
        }

        const parsed = createCampaignSchema.safeParse(input);
        if (!parsed.success) {
            return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
        }
        const data = parsed.data;

        const event = await prisma.event.findUnique({
            where: { id: data.eventId },
            select: {
                id: true,
                organizerId: true,
                title: true,
                slug: true,
                startDate: true,
                location: true,
                onlineUrl: true,
                eventType: true,
                imageUrl: true,
            },
        });
        if (!event) return { error: "Évènement introuvable." };
        if (dbUser.role !== "ADMIN" && event.organizerId !== dbUser.id) {
            return { error: "Vous n'êtes pas le propriétaire de cet évènement." };
        }

        if (!data.targetPlatformUsers && data.externalEmails.length === 0) {
            return {
                error: "Sélectionnez au moins une cible : utilisateurs de la plateforme ou liste externe.",
            };
        }

        // ── Cooldown anti-abus ──────────────────────────────────────────
        const previousCampaigns = await prisma.eventCampaign.findMany({
            where: { eventId: event.id },
            orderBy: { createdAt: "desc" },
            take: MAX_CAMPAIGNS_PER_EVENT,
            select: { createdAt: true },
        });
        if (previousCampaigns.length >= MAX_CAMPAIGNS_PER_EVENT) {
            return {
                error: `Limite de ${MAX_CAMPAIGNS_PER_EVENT} campagnes atteinte pour cet évènement.`,
            };
        }
        if (previousCampaigns.length > 0) {
            const hoursSince =
                (Date.now() - previousCampaigns[0].createdAt.getTime()) / 3_600_000;
            if (hoursSince < COOLDOWN_HOURS) {
                const remainingHours = Math.ceil(COOLDOWN_HOURS - hoursSince);
                return {
                    error: `Merci de patienter encore ${remainingHours}h avant une nouvelle campagne pour cet évènement.`,
                };
            }
        }

        // ── Résolution des destinataires ────────────────────────────────
        const externalEmails = parseEmailList(data.externalEmails.join("\n"));

        const suppressed = externalEmails.length
            ? await prisma.campaignSuppression.findMany({
                  where: { email: { in: externalEmails } },
                  select: { email: true },
              })
            : [];
        const suppressedSet = new Set(suppressed.map((s: { email: string }) => s.email));

        type Recipient = { email: string; name: string; userId: string | null };
        const recipients = new Map<string, Recipient>();

        if (data.targetPlatformUsers) {
            const users = await prisma.user.findMany({
                where: { newsletterOptIn: true },
                select: { id: true, email: true, name: true },
            });
            for (const u of users) {
                recipients.set(u.email.toLowerCase(), {
                    email: u.email,
                    name: u.name,
                    userId: u.id,
                });
            }
        }

        for (const email of externalEmails) {
            if (suppressedSet.has(email) || recipients.has(email)) continue;
            recipients.set(email, { email, name: "vous", userId: null });
        }

        if (recipients.size === 0) {
            return {
                error: "Aucun destinataire à contacter (liste vide après filtrage des désabonnés).",
            };
        }

        // ── Création de la campagne ─────────────────────────────────────
        const campaign = await prisma.eventCampaign.create({
            data: {
                eventId: event.id,
                organizerId: dbUser.id,
                subject: data.subject,
                message: data.message,
                targetPlatformUsers: data.targetPlatformUsers,
                externalEmails,
                recipientCount: recipients.size,
                status: "SENDING",
            },
        });

        // ── Envoi en tâche de fond (ne bloque pas la réponse au dashboard) ──
        const eventDateLabel = event.startDate.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Africa/Porto-Novo",
        });
        const eventLocationText =
            event.eventType === "ONLINE"
                ? "🌐 Évènement en ligne"
                : `📍 ${event.location ?? "Lieu à confirmer"}`;
        const eventUrl = `${APP_URL}/events/${event.slug}`;
        const organizerName = dbUser.name;
        const subject = data.subject;
        const messageHtml = data.message;
        const eventImageUrl = event.imageUrl;
        const eventTitle = event.title;
        const recipientList = Array.from(recipients.values());

        after(async () => {
            try {
                const emails = await Promise.all(
                    recipientList.map(async (r) => ({
                        from: FROM_CAMPAIGN,
                        to: r.email,
                        subject,
                        html: await render(
                            React.createElement(EventCampaignEmail, {
                                recipientName: r.name,
                                organizerName,
                                subject,
                                messageHtml,
                                eventTitle,
                                eventDateLabel,
                                eventLocationText,
                                eventImageUrl,
                                eventUrl,
                                unsubscribeUrl: r.userId
                                    ? buildUnsubscribeUrl(APP_URL, r.userId)
                                    : buildCampaignUnsubscribeUrl(APP_URL, r.email),
                            }),
                        ),
                    })),
                );
                await batchSend(emails);
                await prisma.eventCampaign.update({
                    where: { id: campaign.id },
                    data: { status: "SENT", sentAt: new Date() },
                });
            } catch (err) {
                console.error("Erreur envoi campagne:", err);
                await prisma.eventCampaign
                    .update({ where: { id: campaign.id }, data: { status: "FAILED" } })
                    .catch(() => {});
            }
        });

        revalidatePath(`/dashboard/events/${event.id}`);
        return { success: true, recipientCount: recipients.size };
    } catch (error) {
        console.error("Erreur createEventCampaign:", error);
        return { error: "Erreur interne." };
    }
}
