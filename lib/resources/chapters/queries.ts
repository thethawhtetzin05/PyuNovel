import { DrizzleD1Database } from 'drizzle-orm/d1';
import { chapters, novels } from '@/db/schema';
import { eq, asc, desc, and, gt, lt } from 'drizzle-orm';

// 👇 ၁။ Function အားလုံးရဲ့ Parameter မှာ (db: DrizzleD1Database<any>) လို့ ပြောင်းထားပါတယ်
// 👇 ၂။ Function ထဲမှာ 'const db = drizzle(...)' ဆိုတာ လုံးဝ မပါတော့ပါဘူး

// ဝတ္ထုတစ်ခုလုံးရဲ့ အခန်းစာရင်းကို ယူရန်
export async function getChaptersByNovelId(db: DrizzleD1Database<any>, novelId: number) {
  // ⚠️ ဒီနေရာမှာ const db = drizzle(...) မလိုတော့ပါ
  return await db
    .select({
      id: chapters.id,
      title: chapters.title,
      sortIndex: chapters.sortIndex,
      isPaid: chapters.isPaid,
      createdAt: chapters.createdAt,
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

  // A. ဝတ္ထုကို Slug နဲ့ အရင်ရှာမယ်
  const novel = await db
    .select({ id: novels.id, title: novels.title, slug: novels.slug })
    .from(novels)
    .where(eq(novels.slug, slug))
    .get();

  if (!novel) return null;

  // B. လက်ရှိ ဖတ်မယ့် အခန်းကို ရှာမယ်
  const chapter = await db
    .select()
    .from(chapters)
    .where(
      and(
        eq(chapters.novelId, novel.id),
        eq(chapters.sortIndex, chapterIndex)
      )
    )
    .get();

  if (!chapter) return null;

  // C. ရှေ့အခန်း (Previous)
  const prevChapter = await db
    .select({ sortIndex: chapters.sortIndex })
    .from(chapters)
    .where(
      and(
        eq(chapters.novelId, novel.id),
        lt(chapters.sortIndex, chapterIndex)
      )
    )
    .orderBy(desc(chapters.sortIndex))
    .limit(1)
    .get();

  // D. နောက်အခန်း (Next)
  const nextChapter = await db
    .select({ sortIndex: chapters.sortIndex })
    .from(chapters)
    .where(
      and(
        eq(chapters.novelId, novel.id),
        gt(chapters.sortIndex, chapterIndex)
      )
    )
    .orderBy(asc(chapters.sortIndex))
    .limit(1)
    .get();

  return {
    chapter,
    novel,
    prev: prevChapter,
    next: nextChapter
  };
}