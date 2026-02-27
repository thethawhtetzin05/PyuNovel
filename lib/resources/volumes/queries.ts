import { DrizzleD1Database } from 'drizzle-orm/d1';
import { volumes } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function getVolumesByNovelId(db: DrizzleD1Database<any>, novelId: number) {
    return await db
        .select()
        .from(volumes)
        .where(eq(volumes.novelId, novelId))
        .orderBy(asc(volumes.sortIndex))
        .all();
}
