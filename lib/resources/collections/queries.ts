import { DrizzleD1Database } from 'drizzle-orm/d1';
import { collections, novels, chapters } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Check if a specific novel is collected by the user
export async function isNovelCollected(
    db: DrizzleD1Database<Record<string, unknown>>,
    userId: string,
    novelId: number
) {
    const result = await db.select()
        .from(collections)
        .where(
            and(
                eq(collections.userId, userId),
                eq(collections.novelId, novelId)
            )
        )
        .get();

    return !!result;
}

// Get the user's collection with novel details and last read chapter
export async function getUserCollections(
    db: DrizzleD1Database<Record<string, unknown>>,
    userId: string
) {
    return await db.select({
        collectionId: collections.id,
        updatedAt: collections.updatedAt,

        novel: {
            id: novels.id,
            title: novels.title,
            slug: novels.slug,
            coverUrl: novels.coverUrl,
            author: novels.author,
            status: novels.status,
        },

        lastReadChapterId: collections.lastReadChapterId,
        lastReadChapterTitle: chapters.title
    })
        .from(collections)
        .innerJoin(novels, eq(collections.novelId, novels.id))
        .leftJoin(chapters, eq(collections.lastReadChapterId, chapters.id))
        .where(eq(collections.userId, userId))
        .orderBy(desc(collections.updatedAt))
        .all();
}
