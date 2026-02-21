'use server';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { updateChapter } from '@/lib/resources/chapters/mutations'; // Mutation ရှိပြီးသားကို သုံးမယ်
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from 'next/navigation';
import { drizzle } from 'drizzle-orm/d1';
import { z } from 'zod';

const UpdateChapterSchema = z.object({
  chapterId: z.string().min(1, "Chapter ID is required"),
  novelSlug: z.string().min(1, "Novel Slug is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

export async function updateChapterAction(formData: FormData) {
  const { env } = getRequestContext();
  const db = drizzle(env.DB);

  // Auth Check
  const auth = createAuth(env.DB);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/sign-in');

  // Form Data Validation
  const validatedFields = UpdateChapterSchema.safeParse({
    chapterId: formData.get('chapterId'),
    novelSlug: formData.get('novelSlug'),
    title: formData.get('title'),
    content: formData.get('content'),
  });

  if (!validatedFields.success) {
    throw new Error("Invalid Input: " + Object.values(validatedFields.error.flatten().fieldErrors).flat().join(", "));
  }

  const { chapterId, novelSlug, title, content } = validatedFields.data;

  try {
    // Database မှာ သွားပြင်မယ်
    await updateChapter(db, chapterId, {
      title,
      content,
      updatedAt: new Date() // ပြင်တဲ့ရက်စွဲ ထည့်မယ်
    });
  } catch (e) {
    console.error(e);
    throw new Error("Failed to update chapter");
  }

  // ပြီးရင် Novel Detail စာမျက်နှာကို ပြန်ပို့မယ်
  redirect(`/novel/${novelSlug}`);
}