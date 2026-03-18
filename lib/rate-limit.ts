import { sql, eq } from "drizzle-orm";
import { rateLimits } from "@/db/schema";
import { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

/**
 * Basic rate limiting helper using D1.
 * @param db Drizzle database instance
 * @param key Unique key for the limit (e.g., "endpoint:ip")
 * @param limit Max hits allowed within the window
 * @param windowSeconds Window duration in seconds
 * @returns { success: boolean, remaining: number, resetAt: Date }
 */
export async function rateLimit(
    db: DrizzleD1Database<typeof schema>,
    key: string,
    limit: number,
    windowSeconds: number
) {
    const now = new Date();
    const windowMs = windowSeconds * 1000;

    // 1. Get current limit record
    const record = await db.query.rateLimits.findFirst({
        where: (rl, { eq }) => eq(rl.id, key)
    });

    if (!record || now > record.resetAt) {
        const resetAt = new Date(now.getTime() + windowMs);
        // Create or Reset window
        await db.insert(rateLimits)
            .values({ id: key, hits: 1, resetAt })
            .onConflictDoUpdate({
                target: rateLimits.id,
                set: { hits: 1, resetAt }
            })
            .run();

        return { success: true, remaining: limit - 1, resetAt };
    }

    if (record.hits >= limit) {
        return { success: false, remaining: 0, resetAt: record.resetAt };
    }

    // Increment hits
    await db.update(rateLimits)
        .set({ hits: record.hits + 1 })
        .where(eq(rateLimits.id, key))
        .run();

    return { success: true, remaining: limit - (record.hits + 1), resetAt: record.resetAt };
}
