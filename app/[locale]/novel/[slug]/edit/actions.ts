'use server';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { updateNovel } from '@/lib/resources/novels/mutations';
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from '@/i18n/routing';
import { getLocale } from 'next-intl/server';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from "@/db/schema";
import { UpdateNovelSchema } from "@shared/schemas/novel";

export async function updateNovelAction(formData: FormData) {
  const { env } = getRequestContext();

  const db = drizzle(env.DB, { schema });

  // Auth Check
  const auth = createAuth(env.DB);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect({ href: '/sign-in', locale: await getLocale() });
    return;
  }

  // Form Data Validation
  const validatedFields = UpdateNovelSchema.safeParse({
    novelId: formData.get('novelId'),
    oldImageUrl: formData.get('oldImageUrl'),
    title: formData.get('title'),
    englishTitle: formData.get('englishTitle'),
    description: formData.get('description'),
    tags: formData.get('tags'),
  });

  if (!validatedFields.success) {
    throw new Error("Invalid Input: " + Object.values(validatedFields.error.flatten().fieldErrors).flat().join(", "));
  }

  const { novelId, oldImageUrl, title, englishTitle, description, tags } = validatedFields.data;
  const coverFile = formData.get('coverImage') as File;

  let imageUrl = oldImageUrl; // ပုံအသစ်မတင်ရင် အဟောင်းအတိုင်းထားမယ်

  // ပုံအသစ်ပါလာရင် R2 ပေါ်တင်မယ်
  if (coverFile && coverFile.size > 0 && coverFile.name !== "undefined") {
    try {
      const fileName = `${crypto.randomUUID()}-${coverFile.name}`;
      await env.R2_BUCKET.put(fileName, await coverFile.arrayBuffer(), {
        httpMetadata: { contentType: coverFile.type },
      });
      imageUrl = `/api/file/${fileName}`;
    } catch (error) {
      console.error("Image Upload Failed:", error);
    }
  }

  // Tag များကို သန့်ရှင်းရေးလုပ်ခြင်း
  const processedTags = tags
    ? tags.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => {
        const lower = tag.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(', ')
    : '';

  // Database မှာ သွားပြင်မယ်
  const updatedNovel = await updateNovel(db, novelId, {
    title,
    englishTitle,
    description,
    imageUrl,
    tags: processedTags,
    slug: englishTitle // Slug ကိုပါ ပြောင်းပေးလိုက်မယ် (သတိထားပါ: Link တွေပြောင်းသွားနိုင်ပါတယ်)
  },
    session!.user.id);

  // ပြီးရင် ပြင်လိုက်တဲ့ Novel ဆီ ပြန်ပို့မယ်
  redirect({ href: `/novel/${updatedNovel.slug}` as any, locale: await getLocale() });
}