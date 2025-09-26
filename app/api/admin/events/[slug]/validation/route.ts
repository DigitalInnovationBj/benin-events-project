import { CheckUserRole } from "@/functions/checkUserRole";
import { prisma } from "@/functions/prisma";
import { EVENTSTATUS, Role } from "@prisma/client";
import { ApiResponse } from "@/utils/format-api-response";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const user = await CheckUserRole(request, Role.ADMIN);
        if (user.state === false) {
            return ApiResponse({
                success: false,
                error: user.error || "Unauthorized",
                statusCode: 401,
            });
        }
        const { slug } = await params;
        if (!slug) {
            return ApiResponse({
                success: false,
                error: "Slug parameter is required",
                statusCode: 400,
            });
        }
        const event = await prisma.event.findUnique({
            where: { slug },
        });
        if (!event) {
            return ApiResponse({
                success: false,
                error: "Event not found",
                statusCode: 404,
            });
        }
        if (event.status === EVENTSTATUS.PENDING) {
            await prisma.event.update({
                where: { slug },
                data: { status: EVENTSTATUS.APPROVED },
            });
        } else if (event.status === EVENTSTATUS.APPROVED) {
            await prisma.event.update({
                where: { slug },
                data: { status: EVENTSTATUS.REJECTED },
            });
        }
        return ApiResponse({
            success: true,
            data: event,
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
