import { CheckUserRole } from "@/functions/checkUserRole";
import { prisma } from "@/functions/prisma";
import { Role } from "@prisma/client";
import { ApiResponse } from "@/utils/format-api-response";
import { Event, eventSchema } from "@/validators/eventSchema";

export async function GET() {
    try {
        const events: Event[] = await prisma.event.findMany({
            include: {
                categories: true,
                tickets: true,
                feedbacks: true,
                _count: {
                    select: {
                        favorites: true,
                    },
                },
                dates: true,
            },
        });
        return ApiResponse({
            success: true,
            data: events,
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

export async function POST(request: Request) {
    const user = await CheckUserRole(request, Role.USER);
    if (user.state === false) {
        return ApiResponse({
            success: false,
            error: user.error || "Unauthorized",
            statusCode: 401,
        });
    }
    try {
        const body = await request.json();
        const validateData = eventSchema.safeParse(body);
        if (!validateData.success) {
            return ApiResponse({
                success: false,
                error: validateData.error.issues
                    .map((issue) => issue.message)
                    .join(", "),
                statusCode: 400,
            });
        }
        const event = await prisma.event.create({
            data: validateData.data,
        });
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
