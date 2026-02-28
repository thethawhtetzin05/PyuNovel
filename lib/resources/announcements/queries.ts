import { eq, desc, isNull, and } from 'drizzle-orm';
import { type DrizzleD1Database } from 'drizzle-orm/d1';
import { announcements } from '@/db/schema';

/**
 * Fetch the latest active announcements.
 * @param db The Drizzle D1 database instance
 * @param limit Optional limit, defaults to 3
 * @returns Array of active announcements
 */
export async function getLatestAnnouncements(db: DrizzleD1Database<any>, limit: number = 3) {
    return await db.select()
        .from(announcements)
        .where(
            and(
                eq(announcements.isActive, true),
                isNull(announcements.deletedAt)
            )
        )
        .orderBy(desc(announcements.createdAt))
        .limit(limit);
}
