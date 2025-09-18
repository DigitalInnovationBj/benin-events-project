import { CheckUserRole } from "@/functions/checkUserRole";
import { prisma } from "@/functions/prisma";
import { Role } from "@/lib/generated/prisma";
import { ApiResponse } from "@/utils/format-api-response";

export async function GET( request: Request, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const user = await CheckUserRole(request, Role.USER);
        if (user.state === false) {
            return ApiResponse({
                success: false,
                error: user.error || "Unauthorized",
                statusCode: 401,
            });
        }
        const userData = await prisma.user.findUnique({
            where: { id: user.user?.id },
            include: {
                favorites: true,
                notifications: true,
                feedbacks: true,
                events: true,
                tickets: true
            },
        });
        if (!userData) {
            return ApiResponse({
                success: false,
                error: "User not found",
                statusCode: 404,
            });
        }
        return ApiResponse({
            success: true,
            data: userData,
            statusCode: 200,
        });
    } catch (error) {
        return ApiResponse({
            success: false,
            error: (error as Error).message,
            statusCode: 500,
        });
    }
}