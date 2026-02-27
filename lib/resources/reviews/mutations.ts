import { DrizzleD1Database } from 'drizzle-orm/d1';
import { reviews } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function createReview(
    db: DrizzleD1Database<any>,
    data: { novelId: number; rating: number; comment?: string },
    userId: string
) {
    // Check if a review already exists
    const existingReview = await db
        .select()
        .from(reviews)
        .where(
            and(
                eq(reviews.novelId, data.novelId),
                eq(reviews.userId, userId)
            )
        )
        .get();

    if (existingReview) {
        throw new Error('You have already reviewed this novel.');
    }

    return await db.insert(reviews).values({
        novelId: data.novelId,
        userId: userId,
        rating: data.rating,
        comment: data.comment,
        createdAt: new Date(),
        updatedAt: new Date(),
    }).returning().get();
}

export async function updateReview(
    db: DrizzleD1Database<any>,
    reviewId: number,
    data: { rating: number; comment?: string },
    userId: string
) {
    const existingReview = await db
        .select()
        .from(reviews)
        .where(
            and(
                eq(reviews.id, reviewId),
                eq(reviews.userId, userId)
            )
        )
        .get();

    if (!existingReview) {
        throw new Error('Review not found or unauthorized.');
    }

    return await db.update(reviews)
        .set({
            rating: data.rating,
            comment: data.comment,
            updatedAt: new Date()
        })
        .where(eq(reviews.id, reviewId))
        .returning()
        .get();
}

export async function deleteReview(
    db: DrizzleD1Database<any>,
    reviewId: number,
    userId: string
) {
    const existingReview = await db
        .select()
        .from(reviews)
        .where(
            and(
                eq(reviews.id, reviewId),
                eq(reviews.userId, userId)
            )
        )
        .get();

    if (!existingReview) {
        throw new Error('Review not found or unauthorized.');
    }

    return await db.delete(reviews)
        .where(eq(reviews.id, reviewId))
        .returning()
        .get();
}
