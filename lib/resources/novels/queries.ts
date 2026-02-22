import { DrizzleD1Database } from 'drizzle-orm/d1';
import { novels } from '@/db/schema'; // Schema လမ်းကြောင်း မှန်ပါစေ
import { eq, desc, sql } from 'drizzle-orm';

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
    .select()
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
    .select()
    .from(novels)
    .orderBy(desc(novels.views), desc(novels.createdAt))
    .limit(limit)
    .all();
});

// ၂။ Slug နဲ့ ရှာမည့် Function (Novel Detail Page အတွက်)
export const getNovelBySlug = cache(async (db: DrizzleD1Database<Record<string, unknown>>, slug: string) => {
  return await db
    .select() // .select() ဆိုရင် Column အားလုံး (tags အပါအဝင်) ကို အလိုလို ယူပေးပါတယ်
    .from(novels)
    .where(eq(novels.slug, slug))
    .get();
});

// ၃။ User ID နဲ့ ရှာမည့် Function (Admin Dashboard အတွက်)
export async function getNovelsByUserId(db: DrizzleD1Database<Record<string, unknown>>, userId: string) {
  return await db
    .select()
    .from(novels)
    .where(eq(novels.ownerId, userId))
    .orderBy(desc(novels.createdAt))
    .all();
}