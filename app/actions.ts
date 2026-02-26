'use server';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { createNovel } from '@/lib/resources/novels/mutations';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { drizzle } from 'drizzle-orm/d1';
import * as schema from "@/db/schema";
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";


// ၁။ Data မှန်ကန်မှုရှိမရှိ စစ်ဆေးမည့် စည်းမျဉ်း (Schema)
const CreateNovelSchema = z.object({
  title: z.string().min(1, "ခေါင်းစဉ် ရေးရန် လိုအပ်ပါသည်"),
  englishTitle: z.string().min(1, "English Title (URL အတွက်) လိုအပ်ပါသည်"), // 👈 အသစ် ထပ်ဖြည့်ထားပါတယ်
  author: z.string().min(1, "စာရေးသူအမည် ရေးရန် လိုအပ်ပါသည်"),
  description: z.string().optional(),
  tags: z.string().optional(),
});

export async function addNovelAction(formData: FormData) {
  const { env } = getRequestContext();
  const db = drizzle(env.DB, { schema });

  // ၂။ User Session ကို ယူပါ
  const auth = createAuth(env.DB);
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    throw new Error("Unauthorized: Please login first");
  }

  // ၃။ Form Data များကို ဘေးကင်းလုံခြုံစွာ ရယူခြင်း (null ဖြစ်မသွားအောင် ကာကွယ်ထားတယ်)
  const rawInput = {
    title: formData.get('title')?.toString() || '',
    englishTitle: formData.get('englishTitle')?.toString() || '', // 👈 သေချာ ယူထားပါတယ်
    author: formData.get('author')?.toString() || '',
    description: formData.get('description')?.toString() || '',
    tags: formData.get('tags')?.toString() || '',
  };

  // ၄။ Validation စစ်ဆေးခြင်း
  const validation = CreateNovelSchema.safeParse(rawInput);

  if (!validation.success) {
    console.error("Validation Error:", validation.error.flatten());
    throw new Error("Invalid Input Data: " + Object.values(validation.error.flatten().fieldErrors).flat().join(", "));
  }

  const data = validation.data;

  // ၅။ Tag များကို သန့်ရှင်းရေးလုပ်ခြင်း
  const processedTags = data.tags
    ? data.tags.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => {
        const lower = tag.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(', ')
    : '';

  // ၆။ Database ထဲ ထည့်ခြင်း
  try {
    await createNovel(db, session.user.id, {
      title: data.title,
      author: data.author,
      description: data.description || '',
      tags: processedTags,

      englishTitle: data.englishTitle, // 👈 Zod ကနေ စစ်ပြီးသား data ကို သုံးလိုက်ပြီ
      imageUrl: null,
      status: "ongoing",
    });

    // Cache ရှင်းမယ်
    revalidatePath('/');

  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create novel. Please try again.");
  }

  // ၇။ အောင်မြင်ရင် Homepage သို့ ပြန်ပို့မယ်
  redirect('/');
}