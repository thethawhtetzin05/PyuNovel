import { DrizzleD1Database } from 'drizzle-orm/d1';
import { user, session } from '@/db/schema';
import { sql, desc, eq, gt, or } from 'drizzle-orm';

export interface UserStats {
    totalUsers: number;
    daily: number;
    weekly: number;
    monthly: number;
    peakHours: { hour: string; count: number }[];
}

export async function getUserStatistics(db: DrizzleD1Database<any>): Promise<UserStats> {
    const now = new Date();

    // 24 hours ago
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    // 7 days ago
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    // 30 days ago
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Total Registered Users
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(user);
    const totalUsers = totalResult[0]?.count || 0;

    // 2. Daily (Active in last 24 hours)
    const dailyResult = await db.select({ count: sql<number>`count(distinct ${session.userId})` })
        .from(session)
        .where(
            or(
                gt(session.updatedAt, oneDayAgo),
                gt(session.createdAt, oneDayAgo)
            )
        );
    const daily = dailyResult[0]?.count || 0;

    // 3. Weekly (Active in last 7 days)
    const weeklyResult = await db.select({ count: sql<number>`count(distinct ${session.userId})` })
        .from(session)
        .where(
            or(
                gt(session.updatedAt, sevenDaysAgo),
                gt(session.createdAt, sevenDaysAgo)
            )
        );
    const weekly = weeklyResult[0]?.count || 0;

    // 4. Monthly (Active in last 30 days)
    const monthlyResult = await db.select({ count: sql<number>`count(distinct ${session.userId})` })
        .from(session)
        .where(
            or(
                gt(session.updatedAt, thirtyDaysAgo),
                gt(session.createdAt, thirtyDaysAgo)
            )
        );
    const monthly = monthlyResult[0]?.count || 0;

    // 5. Peak Active Hours (When sessions are created most frequently across all time)
    // To do this, we format the createdAt timestamp to extract the hour component.
    // Since timestamp is integer (milliseconds since epoch), it's more complex if it's stored as an int.
    // Drizzle with Cloudflare D1 usually stores mode "timestamp" as epoch milliseconds (integer).
    // SQLite's strftime('%H', datetime(created_at / 1000, 'unixepoch')) extracts the hour.
    const peakHoursResult = await db.select({
        hour: sql<string>`strftime('%H', datetime(${session.createdAt} / 1000, 'unixepoch'))`,
        count: sql<number>`count(*)`
    })
        .from(session)
        .groupBy(sql`strftime('%H', datetime(${session.createdAt} / 1000, 'unixepoch'))`)
        .orderBy(desc(sql`count(*)`))
        .limit(5);

    return {
        totalUsers,
        daily,
        weekly,
        monthly,
        peakHours: peakHoursResult.filter(p => p.hour !== null).map(p => ({
            hour: p.hour + ':00', // e.g., "14:00"
            count: p.count
        }))
    };
}
