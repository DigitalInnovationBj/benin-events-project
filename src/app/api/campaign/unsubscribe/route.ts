import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyCampaignUnsubscribeToken } from "@/lib/campaign";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function htmlPage(title: string, message: string): NextResponse {
    return new NextResponse(
        `<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title} — Benin Events</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
               background: #f4f4f5; margin: 0; display: flex; align-items: center;
               justify-content: center; min-height: 100vh; }
        .card { background: #fff; border-radius: 12px; padding: 40px 32px; max-width: 420px;
                text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
        h1 { font-size: 20px; margin: 0 0 12px; }
        p { color: #52525b; font-size: 15px; line-height: 1.6; margin: 0 0 24px; }
        a { display: inline-block; background: #18181b; color: #fff; text-decoration: none;
            padding: 10px 20px; border-radius: 8px; font-size: 14px; }
    </style>
</head>
<body>
    <div class="card">
        <h1>${title}</h1>
        <p>${message}</p>
        <a href="${APP_URL}">Retour à Benin Events</a>
    </div>
</body>
</html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
}

export async function GET(req: NextRequest) {
    const email = req.nextUrl.searchParams.get("e");
    const token = req.nextUrl.searchParams.get("t");

    if (!email || !token || !verifyCampaignUnsubscribeToken(email, token)) {
        return htmlPage(
            "Lien invalide",
            "Ce lien de désinscription est invalide ou a expiré.",
        );
    }

    await prisma.campaignSuppression
        .upsert({
            where: { email: email.toLowerCase() },
            create: { email: email.toLowerCase() },
            update: {},
        })
        .catch(() => null);

    return htmlPage(
        "Désinscription confirmée",
        "Vous ne recevrez plus d'emails de campagne de la part des organisateurs sur Benin Events.",
    );
}
