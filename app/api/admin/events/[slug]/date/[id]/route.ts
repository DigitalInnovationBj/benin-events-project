import { CheckUserRole } from "@/functions/checkUserRole";
import { prisma } from "@/functions/prisma";
import { Role } from "@prisma/client";
import { ApiResponse } from "@/utils/format-api-response";
import { eventDateSchema } from "@/validators/eventDateSchema";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ slug: string; id: string }> }
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
        const { slug, id } = await params;
        if (!slug || !id) {
            return ApiResponse({
                success: false,
                error: "Slug and ID parameters are required",
                statusCode: 400,
            });
        }
        const data = await request.json();
        const validatedData = eventDateSchema.partial().safeParse(data);
        if (!validatedData.success) {
            return ApiResponse({
                success: false,
                error: validatedData.error.issues
                    .map((issue) => issue.message)
                    .join(", "),
                statusCode: 400,
            });
        }
        const event = await prisma.event.findUnique({ where: { slug } });
        if (!event) {
            return ApiResponse({
                success: false,
                error: "Event not found",
                statusCode: 404,
            });
        }
        const date = await prisma.eventDate.findUnique({ where: { id } });
        if (!date) {
            return ApiResponse({
                success: false,
                error: "Date not found",
                statusCode: 404,
            });
        }
        const updatedDate = await prisma.eventDate.update({
            where: { id },
            data: validatedData.data,
        });
        return ApiResponse({
            success: true,
            data: updatedDate,
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

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ slug: string; id: string }> }
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
        const { slug, id } = await params;
        if (!slug || !id) {
            return ApiResponse({
                success: false,
                error: "Slug and ID parameters are required",
                statusCode: 400,
            });
        }
        const event = await prisma.event.findUnique({ where: { slug } });
        if (!event) {
            return ApiResponse({
                success: false,
                error: "Event not found",
                statusCode: 404,
            });
        }
        const date = await prisma.eventDate.findUnique({ where: { id } });
        if (!date) {
            return ApiResponse({
                success: false,
                error: "Date not found",
                statusCode: 404,
            });
        }
        const deletedDate = await prisma.eventDate.delete({
            where: { id },
        });
        return ApiResponse({
            success: true,
            data: deletedDate,
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
