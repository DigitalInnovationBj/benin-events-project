import { CheckUserRole } from "@/functions/checkUserRole";
import { prisma } from "@/functions/prisma";
import { Role } from "@prisma/client";
import { ApiResponse } from "@/utils/format-api-response";
import { isValidSlug } from "@/validators/valid-slug";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
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
            include: {
                favorites: true, // Include users who favorited the event
            },
        });
        if (!event) {
            return ApiResponse({
                success: false,
                error: "Event not found",
                statusCode: 404,
            });
        }
        const favoritedUsers = event.favorites.map((user) => ({
            id: user.id,
        }));
        return ApiResponse({
            success: true,
            data: { event, favoritedUsers },
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

export async function POST(
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
        await prisma.event.update({
            where: { slug },
            data: {
                favorites: {
                    connect: { id: user?.user?.id },
                },
            },
        });
        return ApiResponse({
            success: true,
            data: "Event favorited successfully",
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
        await prisma.event.update({
            where: { slug },
            data: {
                favorites: {
                    disconnect: { id: user?.user?.id },
                },
            },
        });
        return ApiResponse({
            success: true,
            data: "Event unfavorited successfully",
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
