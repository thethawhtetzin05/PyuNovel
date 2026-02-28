import { DrizzleD1Database } from 'drizzle-orm/d1';
import { chapters, novels } from '@/db/schema';
import { eq, asc, desc, and, gt, lt } from 'drizzle-orm';

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

// ဝတ္ထုတစ်ခုလုံးရဲ့ အခန်းစာရင်းကို ယူရန် (content မပါ — list page အတွက် fast query)

export async function getChaptersByNovelId(db: DrizzleD1Database<any>, novelId: number) {
  // ⚠️ ဒီနေရာမှာ const db = drizzle(...) မလိုတော့ပါ
  return await db
    .select({
      id: chapters.id,
      title: chapters.title,
      sortIndex: chapters.sortIndex,
      isPaid: chapters.isPaid,
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
    .select()
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
        eq(chapters.sortIndex, chapterIndex)
      )
    )
    .get();

  if (!result) return null;

  const novelId = result.novel.id;

  // B. ရှေ့အခန်းနဲ့ နောက်အခန်းကို Parallel (Promise.all) နဲ့ ရှာမယ်
  const [prevChapter, nextChapter] = await Promise.all([
    db.select({ sortIndex: chapters.sortIndex })
      .from(chapters)
      .where(
        and(
          eq(chapters.novelId, novelId),
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
          gt(chapters.sortIndex, chapterIndex)
        )
      )
      .orderBy(asc(chapters.sortIndex))
      .limit(1)
      .get()
  ]);

  return {
    chapter: result.chapter,
    novel: { id: result.novel.id, title: result.novel.title, slug: result.novel.slug },
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
    .orderBy(desc(chapters.createdAt))
    .limit(limitCount)
    .all();
}