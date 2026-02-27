import { DrizzleD1Database } from 'drizzle-orm/d1';
import { reviews, user } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { cache } from 'react';

// Get all reviews for a novel
export const getReviewsByNovelId = cache(async (db: DrizzleD1Database<any>, novelId: number) => {
    return await db
        .select({
            id: reviews.id,
            rating: reviews.rating,
            comment: reviews.comment,
            createdAt: reviews.createdAt,
            user: {
                id: user.id,
                name: user.name,
                image: user.image
            }
        })
        .from(reviews)
        .innerJoin(user, eq(reviews.userId, user.id))
        .where(eq(reviews.novelId, novelId))
        .orderBy(desc(reviews.createdAt))
        .all();
});

// Check if a user has already reviewed a novel
export const getUserReview = cache(async (db: DrizzleD1Database<any>, novelId: number, userId: string) => {
    return await db
        .select()
        .from(reviews)
        .where(
            and(
                eq(reviews.novelId, novelId),
                eq(reviews.userId, userId)
            )
        )
        .get();
});
