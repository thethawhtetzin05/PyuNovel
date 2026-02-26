import { DrizzleD1Database } from 'drizzle-orm/d1';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function updateUser(
    db: DrizzleD1Database<any>,
    userId: string,
    data: Partial<typeof user.$inferSelect>
) {
    return await db
        .update(user)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(eq(user.id, userId))
        .returning()
        .get();
}
