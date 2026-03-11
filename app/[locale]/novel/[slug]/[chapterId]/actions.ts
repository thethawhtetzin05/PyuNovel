'use server';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { deleteChapter } from '@/lib/resources/chapters/mutations'; // Mutation ရှိပြီးသား
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { drizzle } from 'drizzle-orm/d1';
import * as schema from "@/db/schema";
import { revalidatePath } from 'next/cache';

export async function deleteChapterAction(chapterId: string, novelSlug: string) {
  const { env } = getRequestContext();
  const db = drizzle(env.DB, { schema });

  // Auth Check
  const auth = createAuth(env.DB);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  try {
    // TODO: Owner စစ်ဆေးချက် ထည့်သင့်ပါတယ် (Database call ခေါ်ပြီး)
    // လောလောဆယ် Auth ဝင်ထားရင် ဖျက်ခွင့်ပြုထားပါမယ်

    await deleteChapter(db, chapterId, session.user.id);

    // ဖျက်ပြီးရင် Novel Detail Page ကို Refresh လုပ်မယ်
    revalidatePath(`/novel/${novelSlug}`);

  } catch (e) {
    console.error("Delete Failed:", e);
    throw new Error("Failed to delete chapter");
  }
}

import { eq, sql } from 'drizzle-orm';
import { chapterUnlocks, coinTransactions, user } from '@/db/schema';

export async function unlockChapterAction(
  chapterId: number,
  novelId: number,
  chapterPrice: number,
  slug: string,
  sortIndex: string
) {
  const { env } = getRequestContext();
  const db = drizzle(env.DB, { schema });
  const auth = createAuth(env.DB);
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const userId = session.user.id;

  // Need to fetch latest user info to get current coin balance
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, userId)
  });

  const userCoins = currentUser?.coins || 0;

  if (userCoins < chapterPrice) {
    return { success: false, error: 'Insufficient coins' };
  }

  try {
    const deductCoinsQuery = db
      .update(user)
      .set({ coins: sql`${user.coins} - ${chapterPrice}` })
      .where(eq(user.id, userId));

    const uuid = globalThis.crypto.randomUUID();
    const createTxnQuery = db
      .insert(coinTransactions)
      .values({
        id: uuid,
        userId: userId,
        amount: chapterPrice,
        type: 'spend',
        status: 'success',
        reference: `chapter_unlock_${chapterId}`,
        createdAt: new Date(),
      });

    const createUnlockQuery = db
      .insert(chapterUnlocks)
      .values({
        userId: userId,
        chapterId: chapterId,
        coinsSpent: chapterPrice,
        unlockedAt: new Date(),
      });

    await db.batch([deductCoinsQuery, createTxnQuery, createUnlockQuery]);

    revalidatePath(`/novel/${slug}/${sortIndex}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error unlocking chapter:', error);
    return { success: false, error: error.message || 'Failed to unlock chapter' };
  }
}
