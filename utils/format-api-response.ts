import { NextResponse } from "next/server";

interface ApiResponse extends NextResponse {
    success: boolean;
    data?: any;
    error?: string;
}

interface ApiResponseParams {
    success: boolean;
    data?: any;
    error?: string;
    statusCode?: number;
}

export function ApiResponse({
    success,
    data,
    error,
    statusCode = 200,
}: ApiResponseParams): ApiResponse {
    return NextResponse.json(
        {
            success,
            data: data || null,
            error: error || null,
        },
        { status: statusCode }
    ) as ApiResponse;
}