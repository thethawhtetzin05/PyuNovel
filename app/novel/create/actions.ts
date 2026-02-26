'use server';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { createNovel } from '@/lib/resources/novels/mutations';
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from 'next/navigation';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from "@/db/schema";
import { z } from 'zod';
import { eq } from 'drizzle-orm';

import { revalidatePath } from 'next/cache';

const CreateNovelSchema = z.object({
  englishTitle: z.string().min(1, "English Title is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  tags: z.string().optional().default(""),
});

export async function createNovelAction(formData: FormData) {
  const { env } = getRequestContext();
  const db = drizzle(env.DB, { schema });

  // 1. Auth Check
  const auth = createAuth(env.DB);
  const headerList = await headers();
  const session = await auth.api.getSession({ headers: headerList });

  if (!session) redirect('/sign-in');

  const userId = session.user.id;

  // 2. Form Data ယူခြင်း & Validation
  const validatedFields = CreateNovelSchema.safeParse({
    englishTitle: formData.get('englishTitle'),
    title: formData.get('title'),
    description: formData.get('description'),
    tags: formData.get('tags'),
  });

  if (!validatedFields.success) {
    throw new Error("Invalid Input: " + Object.values(validatedFields.error.flatten().fieldErrors).flat().join(", "));
  }

  const { englishTitle, title, description, tags } = validatedFields.data;
  const coverFile = formData.get('coverImage') as File;

  let imageUrl = "/placeholder-cover.jpg";

  // 3. Image Upload Logic
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

  let newNovel;
  try {
    // 4. Database ထဲ သိမ်းခြင်း
    newNovel = await createNovel(db, userId, {
      englishTitle,
      title,
      description,
      imageUrl,
      tags,
      author: session.user.name || "Unknown Author",
      status: 'ongoing'
    });

    // 🌟 Auto-upgrade Role to Writer if they are currently a Reader
    if (newNovel && session.user.role === 'reader') {
      await db.update(schema.user)
        .set({ role: 'writer', updatedAt: new Date() })
        .where(eq(schema.user.id, userId))
        .run();
    }
  } catch (e: any) {
    console.error("🔴 Error:", e);
    throw new Error("Failed to create novel: " + e.message);
  }

  // 5. အောင်မြင်ရင် Novel Detail Page ကို သွားမယ်
  if (newNovel) {
    revalidatePath('/writer', 'page');
    revalidatePath('/', 'page');
    redirect(`/novel/${newNovel.slug}`);
  }
}