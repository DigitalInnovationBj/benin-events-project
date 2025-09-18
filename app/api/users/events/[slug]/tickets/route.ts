import { prisma } from "@/functions/prisma";
import { ApiResponse } from "@/utils/format-api-response";
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
        const tickets = await prisma.ticket.findMany({
            where: { event: { slug } }, // Use the resolved slug
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return ApiResponse({ success: true, data: tickets });
    } catch (error) {
        return ApiResponse({
            success: false,
            error: (error as Error).message,
            statusCode: 500,
        });
    }
}