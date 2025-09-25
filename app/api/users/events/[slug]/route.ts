import { CheckUserRole } from "@/functions/checkUserRole";
import { prisma } from "@/functions/prisma";
import { Role } from "@/lib/generated/prisma";
import { ApiResponse } from "@/utils/format-api-response";
import {  eventSchema } from "@/validators/eventSchema";
import { isValidSlug } from "@/validators/valid-slug";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
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


export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
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
        const existingEvent = await prisma.event.findUnique({
            where: { slug }, // Use the resolved slug
        });
        if (!existingEvent) {
            return ApiResponse({
                success: false,
                error: "Event not found",
                statusCode: 404,
            });
        }
        if (existingEvent.organizerId !== user.user?.id) {
            return ApiResponse({
                success: false,
                error: "You are not the organizer of this event",
                statusCode: 403,
            });
        }
        const body = await request.json();
        const validateData = eventSchema.partial().safeParse(body);
        if (!validateData.success) {
            return ApiResponse({
                success: false,
                error: validateData.error.issues.map(issue => issue.message).join(", "),
                statusCode: 400,
            });
        }
        const updatedEvent = await prisma.event.update({
            where: { id: existingEvent.id },
            data: validateData.data,
        });
        return ApiResponse({
            success: true,
            data: updatedEvent,
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