'use server';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { drizzle } from 'drizzle-orm/d1';
import { novels } from '@/db/schema'; // Schema လမ်းကြောင်း မှန်ပါစေ
import { eq, sql } from 'drizzle-orm';

export async function incrementView(novelSlug: string) {
  const { env } = getRequestContext();
  const db = drizzle(env.DB);

  try {
    await db.update(novels)
      .set({
        views: sql`${novels.views} + 1`
      })
      .where(eq(novels.slug, novelSlug))
      .execute();

    console.log(`[VIEW] Incremented view for: ${novelSlug}`);
  } catch (error) {
    console.error("Failed to increment view:", error);
  }
}