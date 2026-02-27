import { DrizzleD1Database } from 'drizzle-orm/d1';
import { volumes } from '@/db/schema';

export async function createVolume(
    db: DrizzleD1Database<any>,
    data: { novelId: number; name: string; sortIndex: number }
) {
    const result = await db.insert(volumes).values(data).returning();
    return result[0];
}
