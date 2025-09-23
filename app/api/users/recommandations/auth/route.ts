import { NextRequest } from 'next/server';
import { prisma } from '@/functions/prisma';
import { ApiResponse } from '@/utils/format-api-response';
import { createClient } from 'redis';
import { dot, norm } from 'mathjs';
import { Matrix } from 'ml-matrix';
import { CheckUserRole } from '@/functions/checkUserRole';
import { Role } from '@/lib/generated/prisma';
import { Event } from '@/validators/eventSchema';

// Redis client setup
const redis = createClient({
    url: process.env.REDIS_URL,
    socket: {
        reconnectStrategy: retries => Math.min(retries * 100, 3000), // Reconnect with exponential backoff
    },
});
redis.on('error', err => console.error('Redis Client Error', err));

// Connect to Redis lazily
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

// Build user and event vectors
async function buildUserVector(userId: string): Promise<number[]> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            favorites: { include: { event: { include: { categories: true } } } },
            feedbacks: { select: { eventId: true, rating: true } },
        },
    });

    if (!user) return [];

    // Fetch all categories for vector dimensions
    const categories = await prisma.category.findMany({ select: { id: true } });
    const categoryMap = new Map(categories.map((c, i) => [c.id, i]));
    const vector: number[] = new Array(categories.length).fill(0);

    // Weight categories based on favorites and tickets
    user.favorites.forEach(fav => {
        if (fav.event.categoryId && categoryMap.has(fav.event.categoryId)) {
            vector[categoryMap.get(fav.event.categoryId)!] += 1;
        }
    });
    user.feedbacks.forEach(fb => {
        if (fb.rating >= 4 && categoryMap.has(fb.eventId)) {
            vector[categoryMap.get(fb.eventId)!] += fb.rating / 5; // Weight by rating
        }
    });

    return vector;
}

async function buildEventVector(event: Event, categoryMap: Map<string, number>): Promise<number[]> {
    const vector: number[] = new Array(categoryMap.size).fill(0);
    if (event.categoryId && categoryMap.has(event.categoryId)) {
        vector[categoryMap.get(event.categoryId)!] = 1;
    }
    return vector;
}

// Collaborative filtering using k-NN
async function getCollaborativeScores(userId: string, events: Event[]): Promise<Map<string, number>> {
    const users = await prisma.user.findMany({ select: { id: true } });
    const favorites = await prisma.favorite.findMany({ select: { userId: true, eventId: true } });

    // Build user-event matrix
    const matrix = Matrix.zeros(users.length, events.length);
    const userIndex = new Map(users.map((u, i) => [u.id, i]));
    const eventIndex = new Map(events.map((e, i) => [e.id, i]));

    favorites.forEach(fav => {
        if (userIndex.has(fav.userId) && eventIndex.has(fav.eventId)) {
            matrix.set(userIndex.get(fav.userId)!, eventIndex.get(fav.eventId)!, 1);
        }
    });

    // Compute user similarities
    const userVector = matrix.getRow(userIndex.get(userId)!);
    const similarities: { userId: string; score: number }[] = [];
    users.forEach((u, i) => {
        if (u.id !== userId) {
            const otherVector = matrix.getRow(i);
            const score = cosineSimilarity(userVector, otherVector);
            similarities.push({ userId: u.id, score });
        }
    });

    // Get top 5 similar users
    const topSimilar = similarities.sort((a, b) => b.score - a.score).slice(0, 5);
    const eventScores = new Map<string, number>();
    events.forEach(event => eventScores.set(event.id, 0));

    // Aggregate scores from similar users
    topSimilar.forEach(sim => {
        const userIdx = userIndex.get(sim.userId)!;
        events.forEach((event, i) => {
            if (matrix.get(userIdx, i) > 0) {
                eventScores.set(event.id, eventScores.get(event.id)! + sim.score * matrix.get(userIdx, i));
            }
        });
    });

    return eventScores;
}

export async function GET(request: NextRequest) {
    try {
        // Ensure Redis is connected
        await ensureRedisConnected();

        // Check user authentication
        const userCheck = await CheckUserRole(request, Role.USER);
        if (userCheck.state === false) {
            return ApiResponse({
                success: false,
                error: userCheck.error || 'Unauthorized',
                statusCode: 401,
            });
        }
        const userId = userCheck.user?.id;
        if (!userId) {
            return ApiResponse({ success: false, error: 'User ID missing', statusCode: 400 });
        }

        // Check Redis cache
        const cacheKey = `recommendations:user:${userId}`;
        const cached = await redis.get(cacheKey);
        if (cached) {
            return ApiResponse({
                success: true,
                data: JSON.parse(cached),
                statusCode: 200,
            });
        }

        // Fetch user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true },
        });
        if (!user) {
            return ApiResponse({ success: false, error: 'User not found', statusCode: 404 });
        }

        // Fetch upcoming events
        const events = await prisma.event.findMany({
            where: {
                dates: { some: { startDateTime: { gt: new Date() } } },
                status: 'APPROVED',
            },
            include: { categories: true },
        });

        // Build vectors
        const categories = await prisma.category.findMany({ select: { id: true } });
        const categoryMap = new Map(categories.map((c, i) => [c.id, i]));
        const userVector = await buildUserVector(userId);

        // Compute content-based scores
        const contentScores = await Promise.all(
            events.map(async event => ({
                event,
                score: cosineSimilarity(userVector, await buildEventVector(event, categoryMap)),
            })),
        );

        // Compute collaborative scores
        const collabScores = await getCollaborativeScores(userId, events);

        // Combine scores (60% content-based, 40% collaborative)
        const recommendations = contentScores
            .map(({ event, score }) => ({
                event,
                score: 0.6 * score + 0.4 * (collabScores.get(event.id) || 0),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        // Store in Recommendation table
        await prisma.recommendation.createMany({
            data: recommendations.map(r => ({
                name: user.name,
                email: user.email,
                eventId: r.event.id,
                score: r.score,
                message: `Recommended based on your interest in ${r.event.categories?.name || 'events'}`,
            })),
        });

        // Cache results in Redis (1-hour TTL)
        await redis.setEx(cacheKey, 3600, JSON.stringify(recommendations.map(r => r.event)));

        return ApiResponse({
            success: true,
            data: recommendations.map(r => r.event),
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