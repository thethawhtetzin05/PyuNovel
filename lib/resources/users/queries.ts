import { DrizzleD1Database } from 'drizzle-orm/d1';
import { user, session, novels } from '@/db/schema';
import { sql, desc, eq, gt, or, inArray, isNull } from 'drizzle-orm';

export interface UserStats {
    totalUsers: number;
    daily: number;
    weekly: number;
    monthly: number;
    peakHours: { hour: string; count: number }[];
}

export interface AuthorNovel {
    id: number;
    title: string;
    englishTitle: string;
    slug: string;
    coverUrl: string | null;
    status: string | null;
    views: number;
    chapterPrice: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export interface AuthorListItem {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
    coins: number;
    telegramId: string | null;
    telegramUsername: string | null;
    telegramName: string | null;
    exp: number;
    level: number;
    createdAt: Date;
    novelsCount: number;
    ongoingNovelsCount: number;
    completedNovelsCount: number;
    totalViews: number;
    novels: AuthorNovel[];
}

export interface AuthorKPIMetrics {
    totalAuthors: number;
    activeAuthors: number;
    totalNovels: number;
    totalViews: number;
    telegramLinkedCount: number;
}

export async function getAuthorsList(db: DrizzleD1Database<any>): Promise<{
    authors: AuthorListItem[];
    metrics: AuthorKPIMetrics;
}> {
    // 1. Fetch all non-deleted novels to associate with owners
    const allNovels = await db.select({
        id: novels.id,
        ownerId: novels.ownerId,
        title: novels.title,
        englishTitle: novels.englishTitle,
        slug: novels.slug,
        coverUrl: novels.coverUrl,
        status: novels.status,
        views: novels.views,
        chapterPrice: novels.chapterPrice,
        createdAt: novels.createdAt,
        updatedAt: novels.updatedAt,
    }).from(novels).where(isNull(novels.deletedAt)).orderBy(desc(novels.views));

    const novelOwnerIds = Array.from(new Set(allNovels.map(n => n.ownerId)));

    // 2. Fetch users who are writers OR who own at least one novel
    let authorsQuery;
    if (novelOwnerIds.length > 0) {
        authorsQuery = db.select({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            coins: user.coins,
            telegramId: user.telegramId,
            telegramUsername: user.telegramUsername,
            telegramName: user.telegramName,
            exp: user.exp,
            level: user.level,
            createdAt: user.createdAt,
        })
        .from(user)
        .where(
            or(
                eq(user.role, 'writer'),
                inArray(user.id, novelOwnerIds)
            )
        );
    } else {
        authorsQuery = db.select({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            coins: user.coins,
            telegramId: user.telegramId,
            telegramUsername: user.telegramUsername,
            telegramName: user.telegramName,
            exp: user.exp,
            level: user.level,
            createdAt: user.createdAt,
        })
        .from(user)
        .where(eq(user.role, 'writer'));
    }

    const rawAuthors = await authorsQuery;

    // Group novels by ownerId
    const novelsByOwner = new Map<string, AuthorNovel[]>();
    for (const novel of allNovels) {
        if (!novelsByOwner.has(novel.ownerId)) {
            novelsByOwner.set(novel.ownerId, []);
        }
        novelsByOwner.get(novel.ownerId)!.push({
            id: novel.id,
            title: novel.title,
            englishTitle: novel.englishTitle,
            slug: novel.slug,
            coverUrl: novel.coverUrl,
            status: novel.status,
            views: novel.views || 0,
            chapterPrice: novel.chapterPrice,
            createdAt: novel.createdAt,
            updatedAt: novel.updatedAt,
        });
    }

    // 3. Construct Author items with aggregated metrics
    const authors: AuthorListItem[] = rawAuthors.map(author => {
        const authorNovels = novelsByOwner.get(author.id) || [];
        const totalViews = authorNovels.reduce((sum, n) => sum + (n.views || 0), 0);
        const ongoingNovelsCount = authorNovels.filter(n => n.status === 'ongoing').length;
        const completedNovelsCount = authorNovels.filter(n => n.status === 'completed').length;

        return {
            id: author.id,
            name: author.name,
            email: author.email,
            image: author.image,
            role: author.role,
            coins: author.coins || 0,
            telegramId: author.telegramId,
            telegramUsername: author.telegramUsername,
            telegramName: author.telegramName,
            exp: author.exp || 0,
            level: author.level || 0,
            createdAt: author.createdAt,
            novelsCount: authorNovels.length,
            ongoingNovelsCount,
            completedNovelsCount,
            totalViews,
            novels: authorNovels,
        };
    });

    // Sort by default: most views first, then most novels, then newest
    authors.sort((a, b) => {
        if (b.totalViews !== a.totalViews) return b.totalViews - a.totalViews;
        if (b.novelsCount !== a.novelsCount) return b.novelsCount - a.novelsCount;
        return (new Date(b.createdAt).getTime()) - (new Date(a.createdAt).getTime());
    });

    // 4. Calculate KPI metrics
    const totalAuthors = authors.length;
    const activeAuthors = authors.filter(a => a.novelsCount > 0).length;
    const totalNovels = allNovels.length;
    const totalViews = allNovels.reduce((sum, n) => sum + (n.views || 0), 0);
    const telegramLinkedCount = authors.filter(a => Boolean(a.telegramId || a.telegramUsername)).length;

    return {
        authors,
        metrics: {
            totalAuthors,
            activeAuthors,
            totalNovels,
            totalViews,
            telegramLinkedCount,
        }
    };
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
