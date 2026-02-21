'use server';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { deleteChapter } from '@/lib/resources/chapters/mutations'; // Mutation ရှိပြီးသား
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { drizzle } from 'drizzle-orm/d1';
import * as schema from "@/db/schema";
import { revalidatePath } from 'next/cache';

export async function deleteChapterAction(chapterId: string, novelSlug: string) {
  const { env } = getRequestContext();
  const db = drizzle(env.DB, { schema });

  // Auth Check
  const auth = createAuth(env.DB);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  try {
    // TODO: Owner စစ်ဆေးချက် ထည့်သင့်ပါတယ် (Database call ခေါ်ပြီး)
    // လောလောဆယ် Auth ဝင်ထားရင် ဖျက်ခွင့်ပြုထားပါမယ်

    await deleteChapter(db, chapterId, session.user.id);

    // ဖျက်ပြီးရင် Novel Detail Page ကို Refresh လုပ်မယ်
    revalidatePath(`/novel/${novelSlug}`);

  } catch (e) {
    console.error("Delete Failed:", e);
    throw new Error("Failed to delete chapter");
  }
}