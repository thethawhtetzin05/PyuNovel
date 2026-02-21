'use server';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { deleteNovel } from '@/lib/resources/novels/mutations';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from "@/db/schema";
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from 'next/cache';

// 👇 (၁) FormData အစား novelId (string or number) ကို တိုက်ရိုက်လက်ခံပါမည်
export async function deleteNovelAction(novelId: string | number) {
  const { env } = getRequestContext();
  const db = drizzle(env.DB, { schema });

  // ၂။ လက်ရှိ Log in ဝင်ထားတဲ့ User ရဲ့ ID ကို ယူပါမယ်
  const auth = createAuth(env.DB);
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Unauthorized: Please log in first.");
  }

  // ❌ formData.get() တွေ မလိုတော့ပါဘူး၊ novelId တန်းရနေပါပြီ
  if (!novelId) {
    throw new Error("Novel ID is missing");
  }

  try {
    // ၃။ db, novelId နဲ့ userId ပြည့်စုံမှ deleteNovel ကို ခေါ်ပါမယ်
    await deleteNovel(db, novelId, userId);

    // ဖျက်ပြီးရင် Writer Dashboard ကို Refresh လုပ်ပါမယ်
    revalidatePath('/writer');

  } catch (e) {
    console.error("Failed to delete novel:", e);
    throw new Error("Failed to delete novel");
  }
}