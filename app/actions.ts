'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { getServerContext } from '@/lib/server-context';
import { CreateNovelSchema } from '@/lib/schemas/novel';
import { createNovel } from '@/lib/resources/novels/mutations';

export async function addNovelAction(formData: FormData) {
  const { db, auth } = getServerContext();

  // ၁။ User Session စစ်ဆေးခြင်း
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    throw new Error("Unauthorized: Please login first");
  }

  // ၂။ Form Data များကို ဘေးကင်းလုံခြုံစွာ ရယူခြင်း
  const rawInput = {
    title: formData.get('title')?.toString() || '',
    englishTitle: formData.get('englishTitle')?.toString() || '',
    author: formData.get('author')?.toString() || '',
    description: formData.get('description')?.toString() || '',
    tags: formData.get('tags')?.toString() || '',
  };

  // ၃။ Zod Validation စစ်ဆေးခြင်း
  const validation = CreateNovelSchema.safeParse(rawInput);

  if (!validation.success) {
    console.error("Validation Error:", validation.error.flatten());
    throw new Error(
      "Invalid Input Data: " +
      Object.values(validation.error.flatten().fieldErrors).flat().join(", ")
    );
  }

  const data = validation.data;

  // ၄။ Tag များကို သန့်ရှင်းရေးလုပ်ခြင်း
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

  // ၅။ Database ထဲ ထည့်ခြင်း
  try {
    await createNovel(db, session.user.id, {
      title: data.title,
      author: data.author,
      description: data.description || '',
      tags: processedTags,
      englishTitle: data.englishTitle,
      imageUrl: null,
      status: "ongoing",
    });

    revalidatePath('/');

  } catch (error) {
    console.error("Database Error:", String(error));
    throw new Error("Failed to create novel. Please try again.", { cause: error });
  }

  // ၆။ အောင်မြင်ရင် Homepage သို့ ပြန်ပို့မည်
  redirect('/');
}