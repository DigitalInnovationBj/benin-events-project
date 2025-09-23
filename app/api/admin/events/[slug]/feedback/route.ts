import { prisma } from "@/functions/prisma";
import { ApiResponse } from "@/utils/format-api-response";
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
            where: { slug },
             include : { feedbacks: true }
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
            data: event.feedbacks,
            statusCode: 200,
        });
    } catch (error) {
        return ApiResponse(
            {
                success: false,
                error: (error as Error).message,
                statusCode: 500,
            }
        ) ;
    }
}