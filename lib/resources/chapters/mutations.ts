import * as schema from "@/db/schema";
import { chapters, novels } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { DrizzleD1Database } from "drizzle-orm/d1";

// Drizzle Schema ကနေ Type ပြန်ယူတာ ပိုမှန်ကန်ပါတယ်
type NewChapter = typeof chapters.$inferInsert;

export const createChapter = async (
  db: DrizzleD1Database<typeof schema>,
  data: {
    novelId: number,
    volumeId?: number | null,
    title: string,
    content: string,
    sortIndex: string | number,
    isPaid: boolean | string,
    status?: 'draft' | 'scheduled' | 'published',
    publishedAt?: Date | null
  },
  userId: string
) => {

  // ၁။ Ownership Check (အတိုချုံးရေးနည်း)
  const novel = await db.query.novels.findFirst({
    where: (novels, { eq, and }) => and(
      eq(novels.id, data.novelId),
      eq(novels.ownerId, userId)
    )
  });

  if (!novel) throw new Error("Unauthorized: Novel not found or you don't own it.");

  // ၂။ Insert Data Preparation
  const newChapter: NewChapter = {
    novelId: data.novelId,
    volumeId: data.volumeId || null,
    title: data.title,
    content: data.content,
    sortIndex: Number(data.sortIndex || 0),
    isPaid: data.isPaid === "on" || data.isPaid === true,
    status: data.status || 'published',
    publishedAt: data.publishedAt || new Date(),
    createdAt: new Date(), // Optional if defaultFn is set in schema
  };

  // ၃။ Insert
  return await db.insert(chapters).values(newChapter).returning().get();
};

export const deleteChapter = async (
  db: DrizzleD1Database<any>,
  chapterId: number | string,
  userId: string
) => {
  const cId = Number(chapterId);

  // 🔥 POWERFUL QUERY: ၁ ကြိမ်တည်းနဲ့ ပိုင်ရှင်စစ်ပြီး ဖျက်မယ်
  // Logic: "Chapter ကိုဖျက်မယ်... ဒါပေမဲ့ အဲဒီ Chapter ရဲ့ Parent Novel ဟာ ဒီ User ပိုင်တဲ့ Novel တွေထဲမှာ ပါမှ ဖျက်မယ်"

  const deletedChapter = await db.delete(chapters)
    .where(
      and(
        eq(chapters.id, cId),
        // Subquery: Novel ပိုင်ရှင်ဟုတ်မှ ဖျက်ခွင့်ပြုမယ်
        inArray(
          chapters.novelId,
          db.select({ id: novels.id })
            .from(novels)
            .where(eq(novels.ownerId, userId))
        )
      )
    )
    .returning() // ဖျက်လိုက်တဲ့ Data ကို ပြန်ထုတ်ပေးမယ်
    .get();

  if (!deletedChapter) {
    throw new Error("Failed to delete: Chapter not found or Unauthorized.");
  }

  return { success: true, deletedId: deletedChapter.id };
}

export const updateChapter = async (
  db: DrizzleD1Database<typeof schema>,
  chapterId: number | string,
  data: {
    title?: string;
    content?: string;
    sortIndex?: number;
    isPaid?: boolean;
    volumeId?: number | null;
    status?: 'draft' | 'scheduled' | 'published';
    publishedAt?: Date | null;
    updatedAt?: Date;
  },
  userId: string
) => {
  const cId = Number(chapterId);

  // Ownership check — deleteChapter နဲ့ တူတူ inArray subquery သုံးပါ
  const updatedChapter = await db.update(chapters)
    .set(data)
    .where(
      and(
        eq(chapters.id, cId),
        inArray(
          chapters.novelId,
          db.select({ id: novels.id })
            .from(novels)
            .where(eq(novels.ownerId, userId))
        )
      )
    )
    .returning()
    .get();

  if (!updatedChapter) {
    throw new Error("Failed to update: Chapter not found or Unauthorized.");
  }

  return updatedChapter;
};

