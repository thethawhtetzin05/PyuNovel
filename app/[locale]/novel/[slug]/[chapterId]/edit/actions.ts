'use server';

import { getServerContext } from '@/lib/server-context';
import { updateChapter } from '@/lib/resources/chapters/mutations';
import { headers } from 'next/headers';
import { redirect } from '@/i18n/routing';
import { getLocale } from 'next-intl/server';
import { z } from 'zod';

const UpdateChapterSchema = z.object({
  chapterId: z.string().min(1, "Chapter ID is required"),
  novelSlug: z.string().min(1, "Novel Slug is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

export async function updateChapterAction(formData: FormData) {
  const { db, auth } = getServerContext();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect({ href: '/sign-in', locale: await getLocale() });
    return;
  }

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
    await updateChapter(db, chapterId, {
      title,
      content,
      updatedAt: new Date()
    }, session!.user.id); // ✅ userId ထည့်ပြီ
  } catch (error) {
    console.error("Update chapter failed:", String(error));
    throw new Error("Failed to update chapter", { cause: error });
  }

  redirect({ href: `/novel/${novelSlug}` as any, locale: await getLocale() });
}