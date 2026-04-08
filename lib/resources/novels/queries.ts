import { DrizzleD1Database } from 'drizzle-orm/d1';
import { novels, collections, chapters } from '@/db/schema'; // Schema လမ်းကြောင်း မှန်ပါစေ
import { eq, desc, sql, count } from 'drizzle-orm';

// 👇 Function အားလုံးကို db (Drizzle Instance) တစ်ခုတည်းသာ လက်ခံအောင် ပြင်ထားပါတယ်
// ❌ getDb() ကို ထပ်သုံးစရာ မလိုတော့ပါဘူး

import { cache } from 'react';

// ١။ ဝတ္ထုအားလုံးကို ဆွဲထုတ်မည့် Function (Homepage အတွက်) Pagination ပါဝင်သည်
export const getNovels = cache(async (
  db: DrizzleD1Database<Record<string, unknown>>,
  page: number = 1,
  limit: number = 20
) => {
  const offset = (page - 1) * limit;
  return await db
    .select({
      id: novels.id,
      title: novels.title,
      slug: novels.slug,
      author: novels.author,
      coverUrl: novels.coverUrl,
      status: novels.status,
      views: novels.views,
      createdAt: novels.createdAt,
    })
    .from(novels)
    .orderBy(desc(novels.createdAt))
    .limit(limit)
    .offset(offset)
    .all();
});

export const getTotalNovelsCount = cache(async (db: DrizzleD1Database<Record<string, unknown>>) => {
  const result = await db.select({ count: sql`count(*)` }).from(novels).all();
  return Number(result[0]?.count || 0);
});

// ၄။ Hero Spotlight — views အများဆုံး ဝတ္ထု N ခုကို ဆွဲထုတ်မည့် Function
export const getTopNovelsByViews = cache(async (db: DrizzleD1Database<Record<string, unknown>>, limit: number = 3) => {
  return await db
    .select({
      id: novels.id,
      title: novels.title,
      slug: novels.slug,
      author: novels.author,
      coverUrl: novels.coverUrl,
      status: novels.status,
      views: novels.views,
      description: novels.description,
    })
    .from(novels)
    .orderBy(desc(novels.views), desc(novels.createdAt))
    .limit(limit)
    .all();
});

// ၂။ Slug နဲ့ ရှာမည့် Function (Novel Detail Page အတွက်)
export const getNovelBySlug = cache(async (db: DrizzleD1Database<Record<string, unknown>>, slug: string) => {
  return await db
    .select({
      id: novels.id,
      slug: novels.slug,
      title: novels.title,
      englishTitle: novels.englishTitle,
      author: novels.author,
      description: novels.description,
      coverUrl: novels.coverUrl,
      tags: novels.tags,
      status: novels.status,
      views: novels.views,
      chapterPrice: novels.chapterPrice,
      isScheduledMode: novels.isScheduledMode,
      scheduledHour: novels.scheduledHour,
      chaptersPerDay: novels.chaptersPerDay,
      ownerId: novels.ownerId,
      createdAt: novels.createdAt,
      updatedAt: novels.updatedAt,
    })
    .from(novels)
    .where(eq(novels.slug, slug))
    .get();
});

// ၃။ User ID နဲ့ ရှာမည့် Function (Admin Dashboard အတွက်)
export async function getNovelsByUserId(db: DrizzleD1Database<Record<string, unknown>>, userId: string) {
  return await db
    .select({
      id: novels.id,
      title: novels.title,
      slug: novels.slug,
      status: novels.status,
      coverUrl: novels.coverUrl,
      views: novels.views,
      isScheduledMode: novels.isScheduledMode,
      scheduledHour: novels.scheduledHour,
      chaptersPerDay: novels.chaptersPerDay,
      createdAt: novels.createdAt,
      updatedAt: novels.updatedAt,
    })
    .from(novels)
    .where(eq(novels.ownerId, userId))
    .orderBy(desc(novels.createdAt))
    .all();
}

// ၅။ Ranking Page - အသစ်ထွက် ဝတ္ထုများ
export const getLatestNovels = cache(async (db: DrizzleD1Database<Record<string, unknown>>, limit: number = 20) => {
  return await db
    .select({
      id: novels.id,
      title: novels.title,
      slug: novels.slug,
      author: novels.author,
      coverUrl: novels.coverUrl,
      status: novels.status,
      views: novels.views,
      createdAt: novels.createdAt,
    })
    .from(novels)
    .orderBy(desc(novels.createdAt))
    .limit(limit)
    .all();
});

// ၆။ Ranking Page - Update အဖြစ်ဆုံး ဝတ္ထုများ
export const getRecentlyUpdatedNovels = cache(async (db: DrizzleD1Database<Record<string, unknown>>, limit: number = 20) => {
  return await db
    .select({
      id: novels.id,
      title: novels.title,
      slug: novels.slug,
      author: novels.author,
      coverUrl: novels.coverUrl,
      status: novels.status,
      views: novels.views,
      updatedAt: novels.updatedAt,
    })
    .from(novels)
    .orderBy(desc(novels.updatedAt))
    .limit(limit)
    .all();
});

// ၇။ Search Function - ဝတ္ထုများကို ခေါင်းစဉ် သို့မဟုတ် စာရေးဆရာ နာမည်ဖြင့် ရှာဖွေခြင်း
export const searchNovels = cache(async (db: DrizzleD1Database<Record<string, unknown>>, query: string, limit: number = 5) => {
  if (!query.trim()) return [];

  const searchPattern = `%${query}%`;
  return await db
    .select({
      id: novels.id,
      title: novels.title,
      author: novels.author,
      slug: novels.slug,
      coverUrl: novels.coverUrl,
    })
    .from(novels)
    .where(
      sql`${novels.title} LIKE ${searchPattern} OR ${novels.author} LIKE ${searchPattern} OR ${novels.englishTitle} LIKE ${searchPattern}`
    )
    .limit(limit)
    .all();
});

// ၈။ Ranking Page - Collector အများဆုံး ဝတ္ထုများ
export const getTopNovelsByCollectors = cache(async (db: DrizzleD1Database<Record<string, unknown>>, limit: number = 20) => {
  return await db
    .select({
      id: novels.id,
      title: novels.title,
      slug: novels.slug,
      author: novels.author,
      coverUrl: novels.coverUrl,
      status: novels.status,
      views: novels.views,
      description: novels.description,
      tags: novels.tags,
      collectorCount: count(collections.id),
    })
    .from(novels)
    .leftJoin(collections, eq(collections.novelId, novels.id))
    .groupBy(novels.id)
    .orderBy(desc(count(collections.id)), desc(novels.views))
    .all();
});

// ၉။ Novel Statistics — ဝတ္ထုအားလုံး၏ Analytics (Admin Dashboard အတွက်)
export type NovelStats = {
  totalNovels: number;
  totalChapters: number;
  totalViews: number;
  statusCounts: {
    status: string | null;
    count: number;
  }[];
  topNovels: {
    id: number;
    title: string;
    views: number;
    author: string;
    slug: string;
  }[];
};

export const getNovelStatistics = cache(async (db: DrizzleD1Database<Record<string, unknown>>): Promise<NovelStats> => {
  const [totalNovelsResult] = await db.select({ count: sql<number>`count(*)` }).from(novels).all();
  const [totalChaptersResult] = await db.select({ count: sql<number>`count(*)` }).from(chapters).all();
  const [totalViewsResult] = await db.select({ sum: sql<number>`sum(${novels.views})` }).from(novels).all();

  const statusCountsResult = await db
    .select({
      status: novels.status,
      count: sql<number>`count(*)`
    })
    .from(novels)
    .groupBy(novels.status)
    .all();

  const topNovelsResult = await db
    .select({
      id: novels.id,
      title: novels.title,
      views: novels.views,
      author: novels.author,
      slug: novels.slug
    })
    .from(novels)
    .orderBy(desc(novels.views))
    .limit(5)
    .all();

  return {
    totalNovels: Number(totalNovelsResult?.count || 0),
    totalChapters: Number(totalChaptersResult?.count || 0),
    totalViews: Number(totalViewsResult?.sum || 0),
    statusCounts: statusCountsResult.map(s => ({ 
      status: s.status, 
      count: Number(s.count) 
    })),
    topNovels: topNovelsResult.map(n => ({ 
      ...n, 
      views: Number(n.views) 
    }))
  };
});

