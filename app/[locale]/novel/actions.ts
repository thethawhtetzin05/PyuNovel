'use server';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema'; // Schema လမ်းကြောင်း မှန်ပါစေ
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function incrementView(novelSlug: string) {
  const { env } = getRequestContext();
  const db = drizzle(env.DB, { schema });

  try {
    // 1. Update the database
    await db.update(schema.novels)
      .set({
        views: sql`${schema.novels.views} + 1`
      })
      .where(eq(schema.novels.slug, novelSlug))
      .run();

    // 2. Revalidate the path so the user sees the new count
    // Try multiple path variations to ensure the cache is cleared
    revalidatePath(`/novel/${novelSlug}`);
    revalidatePath(`/[locale]/novel/${novelSlug}`, 'page');
    
    console.log(`[VIEW] Incremented view for: ${novelSlug}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to increment view:", error);
    return { success: false, error: String(error) };
  }
}
