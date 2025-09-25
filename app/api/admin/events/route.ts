import { CheckUserRole } from "@/functions/checkUserRole";
import { prisma } from "@/functions/prisma";
import { Role } from "@/lib/generated/prisma";
import { ApiResponse } from "@/utils/format-api-response";
import { eventSchema } from "@/validators/eventSchema";

export async function GET(request: Request) {
    try {
        const user = await CheckUserRole(request, Role.ADMIN);
        if (user.state === false) {
            return ApiResponse({
                success: false,
                error: user.error || "Unauthorized",
                statusCode: 401,
                data: null
            });
        }

        const events = await prisma.event.findMany({});
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
    try {
        const data = await request.json();
        const validatedData = eventSchema.safeParse(data);
        const user = await CheckUserRole(request, Role.ADMIN);
        if (user.state === false) {
            return ApiResponse({
                success: false,
                error: user.error || "Unauthorized",
                statusCode: 401,
                data: null
            });
        }
        if (!validatedData.success) {
            return ApiResponse({
                success: false,
                error: validatedData.error.issues.map(issue => issue.message).join(", "),
                statusCode: 400,
            });
        }

        const newEvent = await prisma.event.create({
            data: validatedData.data
        });

        return ApiResponse({
            success: true,
            data: newEvent,
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