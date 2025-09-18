import { CheckUserRole } from "@/functions/checkUserRole";
import { prisma } from "@/functions/prisma";
import { Role } from "@/lib/generated/prisma";
import { ApiResponse } from "@/utils/format-api-response";
import { feedbackSchema } from "@/validators/feedbackSchema";
import { isValidSlug } from "@/validators/valid-slug";

export async function GET( _request: Request, { params }: { params: Promise<{ slug: string }> }) {
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
        const feedbacks = await prisma.event.findUnique({
            where: { slug }, // Use the resolved slug
            include: {
                feedbacks: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
        if (!feedbacks) {
            return ApiResponse({
                success: false,
                error: "Event not found",
                statusCode: 404,
            });
        }
        return ApiResponse({
            success: true,
            data: feedbacks.feedbacks,
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

export async function POST( request: Request, { params }: { params: Promise<{ slug: string }> }) {
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
        const body = await request.json();
        const validatedData = feedbackSchema.safeParse(body);
        if (!validatedData.success) {
            return ApiResponse({
                success: false,
                error: validatedData.error.issues.map(issue => issue.message).join(", "),
                statusCode: 400,
            });
        }
        const newFeedback = await prisma.feedback.create({
            data: {
                ...validatedData.data,
                eventId: event.id,
                userId: user.user?.id,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return ApiResponse({
            success: true,
            data: newFeedback,
            statusCode: 201,
        });
    } catch (error) {
        return ApiResponse({
            success: false,
            error: (error as Error).message,
            statusCode: 500,
        });
    }
}