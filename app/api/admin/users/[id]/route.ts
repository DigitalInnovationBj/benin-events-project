import { CheckUserRole } from "@/functions/checkUserRole";
import { prisma } from "@/functions/prisma";
import { Role } from "@prisma/client";
import { ApiResponse } from "@/utils/format-api-response";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
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
        const { id } = await params;
        if (!id) {
            return ApiResponse({
                success: false,
                error: "ID parameter is required",
                statusCode: 400,
            });
        }
        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            return ApiResponse({
                success: false,
                error: "User not found",
                statusCode: 404,
            });
        }
        return ApiResponse({
            success: true,
            data: existingUser,
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
    { params }: { params: Promise<{ id: string }> }
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
        const { id } = await params;
        if (!id) {
            return ApiResponse({
                success: false,
                error: "ID parameter is required",
                statusCode: 400,
            });
        }
        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            return ApiResponse({
                success: false,
                error: "User not found",
                statusCode: 404,
            });
        }
        await prisma.user.delete({ where: { id } });
        return ApiResponse({
            success: true,
            data: null,
            statusCode: 204,
        });
    } catch (error) {
        return ApiResponse({
            success: false,
            error: (error as Error).message,
            statusCode: 500,
        });
    }
}
