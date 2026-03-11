import { DrizzleD1Database } from 'drizzle-orm/d1';
import { chapterUnlocks, novelPasses } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function checkChapterAccess(db: DrizzleD1Database<any>, userId: string, novelId: number, chapterId: number): Promise<boolean> {
    // First check if the user has a novel pass for this novel
    const pass = await db
        .select()
        .from(novelPasses)
        .where(
            and(
                eq(novelPasses.userId, userId),
                eq(novelPasses.novelId, novelId)
            )
        )
        .get();

    if (pass) return true;

    // Next check if the user has specifically unlocked this chapter
    const unlock = await db
        .select()
        .from(chapterUnlocks)
        .where(
            and(
                eq(chapterUnlocks.userId, userId),
                eq(chapterUnlocks.chapterId, chapterId)
            )
        )
        .get();

    if (unlock) return true;

    return false;
}
