"use server";

import crypto from "crypto";
import { z } from "zod";
import { requireAdmin } from "@/lib/permissions";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendOrganizerCredentialsEmail } from "@/lib/email";
import { createEventForOrganizer, type CreateEventResult } from "@/actions/event.actions";

function generateTemporaryPassword(): string {
    // 16 caractères base64url — jamais loggé ni renvoyé à l'UI, transmis
    // uniquement via l'email d'identifiants.
    return crypto.randomBytes(12).toString("base64url");
}

// ─────────────────────────────────────────────
// createOrganizerAccount — l'admin crée un compte organisateur déjà validé
// (consentement obtenu hors plateforme) et lui envoie ses identifiants.
// ─────────────────────────────────────────────

const createOrganizerSchema = z.object({
    organizerName: z.string().min(2, "Le nom est trop court"),
    organizerEmail: z.string().email("Email invalide"),
    phoneNumber: z.string().min(8, "Numéro de téléphone invalide"),
    address: z.string().min(3, "Adresse trop courte"),
});

export async function createOrganizerAccount(input: z.infer<typeof createOrganizerSchema>) {
    try {
        await requireAdmin();

        const parsed = createOrganizerSchema.safeParse(input);
        if (!parsed.success) {
            return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
        }
        const data = parsed.data;

        const existing = await prisma.user.findUnique({
            where: { email: data.organizerEmail },
            select: { id: true },
        });
        if (existing) {
            return { error: "Un compte existe déjà avec cet email." };
        }

        const temporaryPassword = generateTemporaryPassword();

        // Appelé côté serveur sans contexte de requête HTTP entrant : le
        // plugin admin de better-auth ignore alors la vérification de
        // permission (elle ne s'applique qu'aux appels via une requête HTTP
        // authentifiée) — on a déjà vérifié requireAdmin() nous-mêmes.
        const created = await auth.api.createUser({
            body: {
                email: data.organizerEmail,
                password: temporaryPassword,
                name: data.organizerName,
                // Le plugin admin de better-auth type `role` sur son propre
                // vocabulaire "user"/"admin" par défaut ; l'app utilise son
                // propre enum Role ("USER"/"ORGANIZER"/"ADMIN") stocké dans
                // la même colonne — accepté tel quel côté runtime (le schéma
                // zod du plugin valide `role` en simple z.string()).
                role: "ORGANIZER" as "admin",
                data: {
                    emailVerified: true,
                    newsletterOptIn: true,
                },
            },
        });

        if (!created?.user) {
            return { error: "Impossible de créer le compte." };
        }

        // Le téléphone/l'adresse ne sont pas des champs de User — on les
        // conserve dans OrganizerRequest (déjà APPROVED) pour garder une
        // trace consultable dans /admin/requests, cohérente avec le flow
        // self-service classique.
        await prisma.organizerRequest.create({
            data: {
                userId: created.user.id,
                organizerName: data.organizerName,
                organizerEmail: data.organizerEmail,
                phoneNumber: data.phoneNumber,
                address: data.address,
                description: "Compte créé directement par un administrateur.",
                status: "APPROVED",
            },
        });

        await sendOrganizerCredentialsEmail({
            to: data.organizerEmail,
            organizerName: data.organizerName,
            temporaryPassword,
        }).catch((err) => console.error("Organizer credentials email error:", err));

        return { success: true, userId: created.user.id };
    } catch (error) {
        console.error("Erreur createOrganizerAccount:", error);
        return { error: "Erreur interne." };
    }
}

// ─────────────────────────────────────────────
// listOrganizers
// ─────────────────────────────────────────────

export async function listOrganizers() {
    await requireAdmin();

    const organizers = await prisma.user.findMany({
        where: { role: { in: ["ORGANIZER", "ADMIN"] } },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            _count: { select: { events: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return { organizers };
}

// ─────────────────────────────────────────────
// createEventOnBehalf — l'admin publie un évènement pour le compte d'un
// organisateur existant (nouvellement créé ou non).
// ─────────────────────────────────────────────

export async function createEventOnBehalf(
    targetOrganizerId: string,
    formData: FormData,
): Promise<CreateEventResult> {
    await requireAdmin();

    const target = await prisma.user.findUnique({
        where: { id: targetOrganizerId },
        select: { id: true, role: true },
    });
    if (!target || (target.role !== "ORGANIZER" && target.role !== "ADMIN")) {
        return { error: "Ce compte n'est pas un organisateur valide." };
    }

    // Toujours sans frais : il n'y a personne en contexte pour fournir un
    // numéro Mobile Money côté paiement lorsqu'un admin publie pour un tiers.
    return createEventForOrganizer(targetOrganizerId, formData, { skipFee: true });
}
