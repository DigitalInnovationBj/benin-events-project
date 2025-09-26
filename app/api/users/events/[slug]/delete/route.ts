import { CheckUserRole } from "@/functions/checkUserRole";
import { prisma } from "@/functions/prisma";
import { EVENTSTATUS, Role } from "@prisma/client";
import { ApiResponse } from "@/utils/format-api-response";
import { isValidSlug } from "@/validators/valid-slug";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const user = await CheckUserRole(request, Role.USER);
    if (user.state === false) {
        return ApiResponse({
            success: false,
            error: user.error || "Unauthorized",
            statusCode: 401,
        });
    }
    try {
        const { slug } = await params; // Await params to resolve the object
        if (!slug) {
            return ApiResponse({
                success: false,
                error: "Slug parameter is required",
                statusCode: 400,
            });
        }
        const isCorrectSlug = isValidSlug(slug);
        if (!isCorrectSlug) {
            return ApiResponse({
                success: false,
                error: "Invalid slug format",
                statusCode: 400,
            });
        }
        const event = await prisma.event.findUnique({
            where: { slug }, // Use the resolved slug
        });
        if (!event) {
            return ApiResponse({
                success: false,
                error: "Event not found",
                statusCode: 404,
            });
        }

        if (event.organizerId !== user.user?.id) {
            return ApiResponse({
                success: false,
                error: "You are not the organizer of this event",
                statusCode: 403,
            });
        }
        const deletedEvent = await prisma.event.update({
            where: { slug },
            data: { status: EVENTSTATUS.CANCELLED },
        });
        return ApiResponse({
            success: true,
            data: deletedEvent,
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
