import { NextResponse } from "next/server";
import { CheckUserRole } from "./checkUserRole";
import { Role } from "@prisma/client";
import { ApiResponse } from "@/utils/format-api-response";
/**
 * Middleware pour protéger les routes admin
 * @param request - La requête HTTP
 * @param handler - La fonction à exécuter si l'utilisateur est admin
 * @returns Response avec gestion d'erreur automatique
 */
export async function withAdminAuth(
    request: Request,
    handler: (
        user: any
    ) => Promise<NextResponse> | NextResponse | typeof ApiResponse
) {
    try {
        const checkRole = await CheckUserRole(request, Role.ADMIN);

        if (!checkRole.state) {
            const statusCode =
                checkRole.error === "No active session" ? 401 : 403;
            return NextResponse.json(
                {
                    message:
                        checkRole.error === "No active session"
                            ? "Authentication required"
                            : "Access denied",
                    error: checkRole.error,
                },
                { status: statusCode }
            );
        }

        // Exécuter le handler avec les informations utilisateur
        return await handler(checkRole.user);
    } catch (error) {
        console.error("Admin middleware error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * Fonction utilitaire pour créer une réponse admin standardisée
 * @param user - Les informations utilisateur
 * @param data - Les données à retourner
 * @param message - Message optionnel
 * @returns NextResponse standardisée
 */
export function createAdminResponse(
    user: any,
    data: any = null,
    message: string = "Success"
) {
    return NextResponse.json(
        {
            message,
            user: {
                id: user?.id,
                name: user?.name,
                email: user?.email,
                role: user?.role,
            },
            ...(data && { data }),
        },
        { status: 200 }
    );
}
