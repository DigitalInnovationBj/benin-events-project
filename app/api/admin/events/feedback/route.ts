import { CheckUserRole } from "@/functions/checkUserRole";
import { prisma } from "@/functions/prisma";
import { Role } from "@/lib/generated/prisma";
import { ApiResponse } from "@/utils/format-api-response";

export async function GET(request: Request, ) {
    try {
        const user = await CheckUserRole(request, Role.ADMIN);
        if (user.state === false) {
            return ApiResponse({
                success: false,
                error: user.error || "Unauthorized",
                statusCode: 401,
            });
        }
        const feedbacks = await prisma.feedback.findMany({
            include: {
                event: true,
            },
        });
        return ApiResponse({
            success: true,
            data: feedbacks,
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