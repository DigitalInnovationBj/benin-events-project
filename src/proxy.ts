import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PROTECTED_ROUTES = ["/dashboard", "/admin", "/agent"];

function matches(path: string, routes: string[]) {
    return routes.some((r) => path === r || path.startsWith(r + "/"));
}

export async function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Check optimiste : lecture du cookie de session, sans appel DB.
    // getSessionCookie gère le préfixe "__Secure-" ajouté en HTTPS —
    // le lire en dur échouerait systématiquement en production.
    // Les layouts serveur (dashboard/admin/agent) revalident la session
    // et le rôle en base : le proxy n'est qu'une première barrière.
    // NB : pas de rebond "déjà connecté" sur les pages d'auth ici — un cookie
    // présent mais invalide créerait une boucle de redirection avec les
    // layouts. Les pages sign-in/sign-up redirigent elles-mêmes côté client
    // quand la session est réellement valide (useSession).
    const isAuthenticated = !!getSessionCookie(request);

    if (matches(path, PROTECTED_ROUTES) && !isAuthenticated) {
        const signInUrl = new URL("/sign-in", request.url);
        signInUrl.searchParams.set(
            "redirect_url",
            request.nextUrl.pathname + request.nextUrl.search,
        );
        return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!api|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    ],
};
