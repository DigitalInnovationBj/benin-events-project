import { CheckUserRole } from "@/functions/checkUserRole";
import { prisma } from "@/functions/prisma";
import { Role } from "@/lib/generated/prisma";
import { ApiResponse } from "@/utils/format-api-response";
import { eventDateSchema } from "@/validators/eventDateSchema";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const user = await CheckUserRole(request, Role.USER);
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
            include: {
                dates: true,
            },
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
            data: event.dates,
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

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const user = await CheckUserRole(request, Role.USER);
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
        const event = await prisma.event.findUnique({ where: { slug } });
        if (!event) {
            return ApiResponse({
                success: false,
                error: "Event not found",
                statusCode: 404,
            });
        }
        const data = await request.json()
        const validateData = eventDateSchema.safeParse(data);
        if (!validateData.success) {
            return ApiResponse({
                success: false,
                error: validateData.error.issues.map(issue => issue.message).join(", "),
                statusCode: 400,
            });
        }
        const date = await prisma.eventDate.create({
            data: {
                eventId: event.id,
                ...validateData.data
            }
        })
        return ApiResponse({
            success: true,
            data: date,
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