import * as schema from "@/db/schema";
import { getRequestContext } from '@cloudflare/next-on-pages';
import { createChapter } from '@/lib/resources/chapters/mutations';
import { getLastChapterIndex } from '@/lib/resources/chapters/queries';
import { getNovelBySlug } from '@/lib/resources/novels/queries';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAuth } from "@/lib/auth"; 
import { headers } from "next/headers";
import { drizzle } from 'drizzle-orm/d1'; 
import Link from 'next/link';
import ChapterForm from './chapter-form'; 
import { z } from "zod";

export const runtime = 'edge';

const chapterSchema = z.object({
  title: z.string().min(1, "ခေါင်းစဉ် မပါမဖြစ် ပါရပါမယ်"),
  content: z.string().min(1, "စာသား တိုလွန်းပါတယ် (အနည်းဆုံး ၁၀ လုံး)"),
  sortIndex: z.coerce.number(), // Input က string လာရင် number ပြောင်းမယ်
  isPaid: z.string().optional(), // Checkbox က "on" (string) သို့မဟုတ် undefined လာတတ်လို့ပါ
});

export default async function CreateChapterPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { env } = getRequestContext();
  const { slug } = await params;

  const db = drizzle(env.DB, { schema });

  // ၁။ Slug နဲ့ Novel ကို ရှာပြီး ID ယူပါမယ်
  const novel = await getNovelBySlug(db, slug);

  if (!novel) {
    return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">Novel not found</div>;
  }

  // ၂။ Login ဝင်ထားလား စစ်မယ်
  const auth = createAuth(env.DB);
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect('/sign-in');
  }

  // ၃။ ဝတ္ထုပိုင်ရှင် ဟုတ်/မဟုတ် စစ်မယ်
  if (novel.ownerId !== session.user.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600 font-bold text-lg">You do not have permission to edit this novel.</p>
        <Link href={`/novel/${slug}`} className="text-gray-600 underline">Go Back</Link>
      </div>
    );
  }

  // Logic: နောက်ဆုံးအခန်းနံပါတ်ကို ရှာပြီး Auto Suggest လုပ်မယ်
  const lastChapter = await getLastChapterIndex(db, novel.id);
  const suggestedIndex = lastChapter ? lastChapter.sortIndex + 1 : 1;

  // ==========================================
  // Server Action (Zod Validation ထည့်ပေါင်းထားသည်)
  // ==========================================
  async function addChapterAction(formData: FormData) {
    'use server';

    if (!novel) throw new Error("Novel not found");

    const { env } = getRequestContext();
    const db = drizzle(env.DB, {schema});

    // Auth Check Again (Security)
    const auth = createAuth(env.DB);
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || novel.ownerId !== session.user.id) return;

    // (၃) Zod နဲ့ Data ကို စစ်ဆေးခြင်း
    const validation = chapterSchema.safeParse({
        title: formData.get('title'),
        content: formData.get('content'),
        sortIndex: formData.get('sortIndex'),
        isPaid: formData.get('isPaid') ? "true" : "false",
    });

    // Validation ကျရင် Error ထုတ်မယ် (Console မှာ ပြမယ်)
    if (!validation.success) {
        console.error("Validation Error:", validation.error.flatten());
        // UI မှာ Error ပြချင်ရင် useActionState သုံးရပါမယ်၊ လောလောဆယ် throw လုပ်ထားပါမယ်
        throw new Error("Invalid Input Data");
    }

    const data = validation.data;
    const isPaidBoolean = data.isPaid === 'on';

    try {
        // (၄) Valid ဖြစ်တဲ့ Data နဲ့ Database ထဲထည့်မယ်
        await createChapter(db, {
            novelId: novel.id, 
            title: data.title,
            content: data.content, 
            sortIndex: data.sortIndex, 
            isPaid: isPaidBoolean,
        }, session.user.id);
        
        // Success Logic
        revalidatePath(`/novel/${slug}`);

    } catch (error) {
        console.error("Failed to create chapter:", error);
        throw error; // Error ကို ပြန်ပစ်ပေးမှ အဆင်ပြေမယ်
    }

    // (၅) Redirect ကို Try/Catch အပြင်ထုတ်ထားတာ ပိုစိတ်ချရပါတယ် (Next.js သဘောအရ)
    redirect(`/novel/${novel.slug}/${data.sortIndex}`);
  }

  // ==========================================
  // UI Rendering
  // ==========================================
  return (
    <div className="min-h-screen bg-white text-gray-900">
        <ChapterForm 
            //novelId={novel.id}
            slug={slug}
            suggestedIndex={suggestedIndex}
            saveAction={addChapterAction} 
        />
    </div>
  );
}