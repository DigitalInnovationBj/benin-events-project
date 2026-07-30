import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import prisma from "@/lib/prisma";
import { sendAuthOtpEmail } from "@/lib/email";

/**
 * Rattache les commandes passées en invité (guestEmail) au compte utilisateur.
 * Porté depuis l'ancien syncUser (époque Clerk) : appelé à la création du compte
 * et à chaque nouvelle session pour rattraper les achats faits entre-temps.
 */
async function linkGuestOrders(userId: string, email: string) {
    try {
        const linked = await prisma.order.updateMany({
            where: { guestEmail: email, userId: null },
            data: { userId, guestEmail: null, guestName: null },
        });
        if (linked.count > 0) {
            console.log(`[auth] ${linked.count} commande(s) invité liée(s) à ${userId}`);
        }
    } catch (err) {
        // Le rattachement ne doit jamais faire échouer l'inscription/connexion.
        console.error("[auth] Liaison des commandes invité échouée :", err);
    }
}

export const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET!,

    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },

    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },

    account: {
        accountLinking: {
            // Mécanisme central de la migration Clerk → better-auth :
            // un login Google dont l'email correspond à un User existant
            // (créé à l'époque Clerk) est rattaché à ce compte — l'utilisateur
            // retrouve commandes, rôle et événements sans aucune intervention.
            enabled: true,
            trustedProviders: ["google"],
        },
    },

    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "USER",
                input: false, // jamais modifiable par le client
            },
            newsletterOptIn: {
                type: "boolean",
                defaultValue: true,
                input: false,
            },
        },
    },

    session: {
        // Évite une requête SQL à chaque getSession() côté serveur : la session
        // est relue depuis un cookie signé pendant maxAge.
        // Contrepartie : une révocation ou un changement de rôle peuvent mettre
        // jusqu'à 5 minutes à se propager sur les autres appareils.
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
        },
    },

    rateLimit: {
        enabled: true,
    },

    plugins: [
        emailOTP({
            otpLength: 6,
            expiresIn: 300,
            allowedAttempts: 3,
            sendVerificationOnSignUp: true,
            overrideDefaultEmailVerification: true,
            sendVerificationOTP: async ({ email, otp, type }) => {
                // L'envoi doit être attendu : une promesse rejetée non capturée
                // ici termine le process Node et coupe la requête en cours.
                await sendAuthOtpEmail({ to: email, otp, type });
            },
        }),
        nextCookies(),
    ],

    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    await linkGuestOrders(user.id, user.email);
                },
            },
        },
        session: {
            create: {
                after: async (session) => {
                    const user = await prisma.user.findUnique({
                        where: { id: session.userId },
                        select: { email: true },
                    });
                    if (user) await linkGuestOrders(session.userId, user.email);
                },
            },
        },
    },
});

export type Session = typeof auth.$Infer.Session;
