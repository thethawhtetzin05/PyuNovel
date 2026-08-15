import { DrizzleD1Database } from 'drizzle-orm/d1';
import { chapters, novels } from '@/db/schema';
import { eq, asc, desc, and, gt, lt, lte, sql } from 'drizzle-orm';

// 👇 ၁။ Function အားလုံးရဲ့ Parameter မှာ (db: DrizzleD1Database<any>) လို့ ပြောင်းထားပါတယ်
// 👇 ၂။ Function ထဲမှာ 'const db = drizzle(...)' ဆိုတာ လုံးဝ မပါတော့ပါဘူး

// Offline download အတွက် — content + novelId အပါအဝင် fields အကုန်ယူမယ်
export async function getChaptersForDownload(db: DrizzleD1Database<any>, novelId: number) {
  return await db
    .select({
      id: chapters.id,
      novelId: chapters.novelId,
      volumeId: chapters.volumeId,
      title: chapters.title,
      content: chapters.content,
      isPaid: chapters.isPaid,
      sortIndex: chapters.sortIndex,
    })
    .from(chapters)
    .where(eq(chapters.novelId, novelId))
    .orderBy(asc(chapters.sortIndex))
    .all();
}

// ဝတ္ထုတစ်ခုလုံး၏ Published Chapter စုစုပေါင်း အရေအတွက်ကို ယူရန် (Count Query)
export async function getChaptersCountByNovelId(db: DrizzleD1Database<any>, novelId: number, volumeId?: number | null) {
  const now = new Date();
  const conditions = [
    eq(chapters.novelId, novelId),
    eq(chapters.status, 'published'),
    lte(chapters.publishedAt, now),
  ];

  if (volumeId !== undefined) {
    if (volumeId === null) {
      conditions.push(sql`${chapters.volumeId} IS NULL`);
    } else {
      conditions.push(eq(chapters.volumeId, volumeId));
    }
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(chapters)
    .where(and(...conditions))
    .get();

  return result?.count ?? 0;
}

// "Read Now" ခလုတ်အတွက် ပထမဆုံး Published Chapter တစ်ခုတည်းကို ယူရန် (1 Row Read)
export async function getFirstPublishedChapter(db: DrizzleD1Database<any>, novelId: number) {
  const now = new Date();
  return await db
    .select({
      id: chapters.id,
      title: chapters.title,
      sortIndex: chapters.sortIndex,
    })
    .from(chapters)
    .where(
      and(
        eq(chapters.novelId, novelId),
        eq(chapters.status, 'published'),
        lte(chapters.publishedAt, now)
      )
    )
    .orderBy(asc(chapters.sortIndex))
    .limit(1)
    .get();
}

// Paginated Chapters ယူရန် (Limit / Offset / VolumeId Filter ပါဝင်သည်)
export async function getPaginatedChaptersByNovelId(
  db: DrizzleD1Database<any>,
  novelId: number,
  options?: { limit?: number; offset?: number; volumeId?: number | null }
) {
  const now = new Date();
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const conditions = [
    eq(chapters.novelId, novelId),
    eq(chapters.status, 'published'),
    lte(chapters.publishedAt, now),
  ];

  if (options?.volumeId !== undefined) {
    if (options.volumeId === null) {
      conditions.push(sql`${chapters.volumeId} IS NULL`);
    } else {
      conditions.push(eq(chapters.volumeId, options.volumeId));
    }
  }

  return await db
    .select({
      id: chapters.id,
      title: chapters.title,
      sortIndex: chapters.sortIndex,
      isPaid: chapters.isPaid,
      createdAt: chapters.createdAt,
      volumeId: chapters.volumeId,
      publishedAt: chapters.publishedAt,
    })
    .from(chapters)
    .where(and(...conditions))
    .orderBy(asc(chapters.sortIndex))
    .limit(limit)
    .offset(offset)
    .all();
}

// ဝတ္ထုတစ်ခုလုံးရဲ့ အခန်းစာရင်းကို ယူရန် (Backward-compatible wrapper with optional limit)
export async function getChaptersByNovelId(
  db: DrizzleD1Database<any>,
  novelId: number,
  options?: { limit?: number; offset?: number; volumeId?: number | null }
) {
  if (options && (options.limit !== undefined || options.offset !== undefined || options.volumeId !== undefined)) {
    return getPaginatedChaptersByNovelId(db, novelId, options);
  }

  const now = new Date();
  return await db
    .select({
      id: chapters.id,
      title: chapters.title,
      sortIndex: chapters.sortIndex,
      isPaid: chapters.isPaid,
      createdAt: chapters.createdAt,
      volumeId: chapters.volumeId,
      publishedAt: chapters.publishedAt,
    })
    .from(chapters)
    .where(
      and(
        eq(chapters.novelId, novelId),
        eq(chapters.status, 'published'),
        lte(chapters.publishedAt, now)
      )
    )
    .orderBy(asc(chapters.sortIndex))
    .all();
}

// Writer Dashboard — includes status/publishedAt but NOT content
export async function getChaptersByNovelIdForWriter(db: DrizzleD1Database<any>, novelId: number) {
  return await db
    .select({
      id: chapters.id,
      title: chapters.title,
      sortIndex: chapters.sortIndex,
      isPaid: chapters.isPaid,
      status: chapters.status,
      publishedAt: chapters.publishedAt,
      createdAt: chapters.createdAt,
      volumeId: chapters.volumeId,
    })
    .from(chapters)
    .where(eq(chapters.novelId, novelId))
    .orderBy(asc(chapters.sortIndex))
    .all();
}

// အခန်းတစ်ခုချင်းစီရဲ့ အသေးစိတ်စာသားကို ယူရန် (Edit အတွက်)
export async function getChapterDetail(db: DrizzleD1Database<any>, novelId: number, sortIndex: number) {
  return await db
    .select({
      id: chapters.id,
      novelId: chapters.novelId,
      volumeId: chapters.volumeId,
      title: chapters.title,
      content: chapters.content,
      isPaid: chapters.isPaid,
      status: chapters.status,
      publishedAt: chapters.publishedAt,
      sortIndex: chapters.sortIndex,
      createdAt: chapters.createdAt,
      updatedAt: chapters.updatedAt,
    })
    .from(chapters)
    .where(
      and(
        eq(chapters.novelId, novelId),
        eq(chapters.sortIndex, sortIndex)
      )
    )
    .get();
}

// နောက်ဆုံးတင်ထားတဲ့ Chapter ရဲ့ sortIndex ကို သိဖို့
export async function getLastChapterIndex(db: DrizzleD1Database<any>, novelId: number) {
  return await db
    .select({ sortIndex: chapters.sortIndex })
    .from(chapters)
    .where(eq(chapters.novelId, novelId))
    .orderBy(desc(chapters.sortIndex))
    .limit(1)
    .get();
}

// Reader Page အတွက် (Previous/Next ပါ ရှာပေးသည့် Function)
export async function getChapterForReader(db: DrizzleD1Database<any>, slug: string, index: string) {
  const chapterIndex = Number(index);

  // A. ဝတ္ထုနဲ့ အခန်းကို JOIN သုံးပြီး တခါတည်း ရှာမယ် (Query Count လျှော့ချရန်)
  const result = await db
    .select({
      chapter: chapters,
      novel: novels
    })
    .from(chapters)
    .innerJoin(novels, eq(chapters.novelId, novels.id))
    .where(
      and(
        eq(novels.slug, slug),
        eq(chapters.sortIndex, chapterIndex),
        eq(chapters.status, 'published'),
        lte(chapters.publishedAt, new Date())
      )
    )
    .get();

  if (!result) return null;

  const novelId = result.novel.id;

  const now = new Date();
  const [prevChapter, nextChapter] = await Promise.all([
    db.select({ sortIndex: chapters.sortIndex })
      .from(chapters)
      .where(
        and(
          eq(chapters.novelId, novelId),
          eq(chapters.status, 'published'),
          lte(chapters.publishedAt, now),
          lt(chapters.sortIndex, chapterIndex)
        )
      )
      .orderBy(desc(chapters.sortIndex))
      .limit(1)
      .get(),
    db.select({ sortIndex: chapters.sortIndex })
      .from(chapters)
      .where(
        and(
          eq(chapters.novelId, novelId),
          eq(chapters.status, 'published'),
          lte(chapters.publishedAt, now),
          gt(chapters.sortIndex, chapterIndex)
        )
      )
      .orderBy(asc(chapters.sortIndex))
      .limit(1)
      .get()
  ]);

  return {
    chapter: result.chapter,
    novel: {
      id: result.novel.id,
      title: result.novel.title,
      slug: result.novel.slug,
      ownerId: result.novel.ownerId,
      chapterPrice: result.novel.chapterPrice
    },
    prev: prevChapter,
    next: nextChapter
  };
}

// နောက်ဆုံး update လုပ်ထားသော Chapter စာရင်းများကို ယူရန် (Latest Chapters Section အတွက်)
export async function getLatestChapters(db: DrizzleD1Database<any>, limitCount: number = 10) {
  return await db
    .select({
      id: chapters.id,
      title: chapters.title,
      sortIndex: chapters.sortIndex,
      createdAt: chapters.createdAt,
      novelSlug: novels.slug,
      novelTitle: novels.title,
      novelCoverUrl: novels.coverUrl,
      novelAuthor: novels.author,
      novelStatus: novels.status,
    })
    .from(chapters)
    .innerJoin(novels, eq(chapters.novelId, novels.id))
    .where(
      and(
        eq(chapters.status, 'published'),
        lte(chapters.publishedAt, new Date())
      )
    )
    .orderBy(desc(chapters.publishedAt))
    .limit(limitCount)
    .all();
}