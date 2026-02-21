import { DrizzleD1Database } from 'drizzle-orm/d1';
import { collections } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

// Add a novel to user's collection
export async function addToCollection(
    db: DrizzleD1Database<Record<string, unknown>>,
    userId: string,
    novelId: number
) {
    return await db.insert(collections).values({
        userId,
        novelId,
    }).onConflictDoNothing(); // Prevent duplicates based on uniqueIndex
}

// Remove a novel from user's collection
export async function removeFromCollection(
    db: DrizzleD1Database<Record<string, unknown>>,
    userId: string,
    novelId: number
) {
    return await db.delete(collections)
        .where(
            and(
                eq(collections.userId, userId),
                eq(collections.novelId, novelId)
            )
        );
}

// Update the reading progress (last read chapter)
export async function updateReadingProgress(
    db: DrizzleD1Database<Record<string, unknown>>,
    userId: string,
    novelId: number,
    chapterId: number
) {
    return await db.update(collections)
        .set({
            lastReadChapterId: chapterId,
            updatedAt: new Date()
        })
        .where(
            and(
                eq(collections.userId, userId),
                eq(collections.novelId, novelId)
            )
        );
}
