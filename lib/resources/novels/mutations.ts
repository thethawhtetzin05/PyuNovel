import { DrizzleD1Database } from "drizzle-orm/d1";
import { novels, chapters } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import * as schema from "@/db/schema";
import { generateSlug } from '@/lib/utils'; // ဒါရှိတယ်လို့ ယူဆပါတယ်

// ၁။ Create Novel
export async function createNovel(
  db: DrizzleD1Database<typeof schema>, // DB Instance တန်းယူမယ်
  userId: string,
  data: {
    englishTitle: string;
    title: string;
    description: string;
    imageUrl: string | null;
    status: 'ongoing' | 'completed' | 'hiatus';
    author?: string; // Optional ဖြစ်နိုင်
    tags?: string;
  }
) {
  // Slug Logic
  const baseSlug = generateSlug(data.englishTitle);
  // Timestamp အစား Random string အတိုက URL ပိုလှစေပါတယ်
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

  const [newNovel] = await db.insert(novels).values({
    ownerId: userId,
    slug: uniqueSlug,
    englishTitle: data.englishTitle,
    title: data.title,
    tags: data.tags || "",

    // Data မပါရင် Default တန်ဖိုးတွေ ထည့်ပေးမယ်
    author: data.author || "",
    description: data.description,
    coverUrl: data.imageUrl,

    status: data.status,

    createdAt: new Date(),
    updatedAt: new Date(),
  })
    .returning(); // Array destructuring နဲ့ result ယူမယ်

  return newNovel;
}

// ၂။ Update Novel (Security ထည့်လိုက်ပါပြီ)
export async function updateNovel(
  db: DrizzleD1Database<typeof schema>,
  novelId: string | number,
  data: Record<string, unknown>, // Partial update data
  userId: string // 👈 Owner Check ဖို့ လိုပါတယ်
) {
  const id = Number(novelId);

  // Owner ဟုတ်မဟုတ် အရင်စစ် (Security)
  const existingNovel = await db.query.novels.findFirst({
    where: (novels, { eq, and }) => and(
      eq(novels.id, id),
      eq(novels.ownerId, userId)
    ),
  });

  if (!existingNovel) {
    throw new Error("Unauthorized: You cannot edit this novel.");
  }

  // updatedAt ကို လက်ရှိအချိန် ပြောင်းပေးလိုက်မယ်
  const updateData = { ...data, updatedAt: new Date() };

  // Update လုပ်မယ်
  const [updatedNovel] = await db.update(novels)
    .set(updateData)
    .where(eq(novels.id, id))
    .returning();

  return updatedNovel;
}

export async function deleteNovel(db: DrizzleD1Database<typeof schema>, novelId: number | string, userId: string) {
  const id = Number(novelId);

  // ၁။ Core Query ပုံစံဖြင့် ဝတ္ထုကို ရှာပါမည် (db.query အစား db.select ကို သုံးသည်)
  const existingNovel = await db
    .select()
    .from(novels)
    .where(
      and(
        eq(novels.id, id),
        eq(novels.ownerId, userId) // ပိုင်ရှင် ဟုတ်မဟုတ် စစ်ဆေးခြင်း
      )
    )
    .get();

  // ဝတ္ထု မရှိရင် (သို့) ပိုင်ရှင် မဟုတ်ရင် ဖျက်ခွင့်မပေးပါ
  if (!existingNovel) {
    throw new Error("Novel not found or unauthorized");
  }

  // ❗ Foreign Key Constraint Error မတက်အောင် Chapters တွေကို အရင်ဖျက်ပါမယ်
  await db
    .delete(chapters)
    .where(eq(chapters.novelId, id))
    .execute();

  // ၂။ ဝတ္ထုကို ဖျက်ပါမည်
  await db
    .delete(novels)
    .where(eq(novels.id, id))
    .execute();

  return true;
}