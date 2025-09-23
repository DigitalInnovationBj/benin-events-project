import { NextRequest } from 'next/server';
import { prisma } from '@/functions/prisma';
import { ApiResponse } from '@/utils/format-api-response';
import { createClient } from 'redis';
import { dot, norm } from 'mathjs';
import { z } from 'zod';
import { createHash } from 'crypto';
import { Event } from '@/validators/eventSchema';

// Input validation schema
const inputSchema = z.object({
    categories: z.array(z.string()).optional(),
    location: z.string().optional(),
    eventType: z.enum(['FREE', 'FREE_WITH_REGISTRATION', 'PAID']).optional(),
    name: z.string().optional().default('Anonymous'),
    email: z.email().optional().default('anonymous@example.com'),
});

// Redis client setup (connect lazily)
const redis = createClient({
    url: process.env.REDIS_URL,
    socket: {
        reconnectStrategy: retries => Math.min(retries * 100, 3000), // Reconnect with exponential backoff
    },
});
redis.on('error', err => console.error('Redis Client Error', err));

// Connect to Redis lazily (only when needed)
let redisConnected = false;
async function ensureRedisConnected() {
    if (!redisConnected) {
        await redis.connect();
        redisConnected = true;
    }
}

// Cosine similarity function
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = dot(vecA, vecB);
    const normA = norm(vecA) as number;
    const normB = norm(vecB) as number;
    return normA === 0 || normB === 0 ? 0 : dotProduct / (normA * normB);
}

// Build input vector from user input
async function buildInputVector(input: z.infer<typeof inputSchema>): Promise<number[]> {
    const categories = await prisma.category.findMany({ select: { id: true } });
    const categoryMap = new Map(categories.map((c, i) => [c.id, i]));
    const vector: number[] = new Array(categoryMap.size + 3).fill(0); // +3 for event types

    if (input.categories && input.categories.length > 0) {
        input.categories.forEach(catId => {
            if (categoryMap.has(catId)) {
                vector[categoryMap.get(catId)!] = 1;
            }
        });
    }

    if (input.eventType) {
        const typeIndex = categories.length + ['FREE', 'FREE_WITH_REGISTRATION', 'PAID'].indexOf(input.eventType);
        vector[typeIndex] = 1;
    }

    return vector;
}

// Build event vector
async function buildEventVector(event: Event, categoryMap: Map<string, number>): Promise<number[]> {
    const vector: number[] = new Array(categoryMap.size + 3).fill(0); // +3 for event types
    if (event.categoryId && categoryMap.has(event.categoryId)) {
        vector[categoryMap.get(event.categoryId)!] = 1;
    }
    const typeIndex = categoryMap.size + ['FREE', 'FREE_WITH_REGISTRATION', 'PAID'].indexOf(event.type);
    vector[typeIndex] = 1;
    return vector;
}

export async function POST(request: NextRequest) {
    try {
        // Ensure Redis is connected
        await ensureRedisConnected();

        // Parse and validate input
        const body = await request.json();
        const validatedInput = inputSchema.safeParse(body);
        if (!validatedInput.success) {
            return ApiResponse({
                success: false,
                error: validatedInput.error.issues.map(issue => issue.message).join(', '),
                statusCode: 400,
            });
        }
        const input = validatedInput.data;

        // Create cache key from input
        const cacheKey = `recommendations:input:${createHash('md5')
            .update(JSON.stringify({ categories: input.categories, location: input.location, eventType: input.eventType }))
            .digest('hex')}`;

        // Check Redis cache
        const cached = await redis.get(cacheKey);
        if (cached) {
            return ApiResponse({
                success: true,
                data: JSON.parse(cached),
                statusCode: 200,
            });
        }

        // Fetch upcoming events
        const events = await prisma.event.findMany({
            where: {
                dates: { some: { startDateTime: { gt: new Date() } } },
                status: 'APPROVED',
                ...(input.location ? { location: { contains: input.location, mode: 'insensitive' } } : {}),
            },
            include: { categories: true },
        });

        // If no events match, return popular events as fallback
        if (events.length === 0) {
            const popularEvents = await prisma.event.findMany({
                where: { status: 'APPROVED', dates: { some: { startDateTime: { gt: new Date() } } } },
                orderBy: { tickets: { _count: 'desc' } },
                take: 10,
                include: { categories: true },
            });
            return ApiResponse({
                success: true,
                data: popularEvents,
                statusCode: 200,
            });
        }

        // Build vectors
        const categories = await prisma.category.findMany({ select: { id: true } });
        const categoryMap = new Map(categories.map((c, i) => [c.id, i]));
        const inputVector = await buildInputVector(input);

        // Compute content-based scores
        const recommendations = await Promise.all(
            events.map(async event => ({
                event,
                score: cosineSimilarity(inputVector, await buildEventVector(event, categoryMap)),
            })),
        );

        // Sort and limit to top 10
        const topRecommendations = recommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        // Store in Recommendation table
        await prisma.recommendation.createMany({
            data: topRecommendations.map(r => ({
                name: input.name,
                email: input.email,
                eventId: r.event.id,
                score: r.score,
                message: `Recommended based on your interest in ${r.event.categories?.name || 'events'}`,
            })),
        });

        // Cache results in Redis (1-hour TTL)
        await redis.setEx(cacheKey, 3600, JSON.stringify(topRecommendations.map(r => r.event)));

        return ApiResponse({
            success: true,
            data: topRecommendations.map(r => r.event),
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