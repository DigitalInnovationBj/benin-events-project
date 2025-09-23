import { CheckUserRole } from "@/functions/checkUserRole";
import { prisma } from "@/functions/prisma";
import { Role } from "@/lib/generated/prisma";
import { ApiResponse } from "@/utils/format-api-response";

export async function GET(request: Request) {
  try {
    const user = await CheckUserRole(request, Role.ADMIN);
    if (user.state === false) {
      return ApiResponse({
        success: false,
        error: user.error || "Unauthorized",
        statusCode: 401,
      });
    }
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return ApiResponse({
      success: true,
      data: users,
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