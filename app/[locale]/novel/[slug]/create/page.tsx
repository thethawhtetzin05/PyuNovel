import * as schema from "@/db/schema";
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getLastChapterIndex } from '@/lib/resources/chapters/queries';
import { getVolumesByNovelId } from '@/lib/resources/volumes/queries';
import { getNovelBySlug } from '@/lib/resources/novels/queries';
import { redirect } from '@/i18n/routing';
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { drizzle } from 'drizzle-orm/d1';
import { Link } from '@/i18n/routing';
import ChapterForm from './chapter-form';

export const runtime = 'edge';

export default async function CreateChapterPage({
  params
}: {
  params: Promise<{ slug: string; locale: string }>
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
    redirect({ href: '/sign-in', locale: (await params).locale });
    return null;
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

  // Logic: နောက်ဆုံးအခန်းကို ရှာပြီး Auto Suggest လုပ်မယ်
  // ⚠️ getChapterDetail ကို သုံးလို့မရပါ (sortIndex မသိသေးလို့)။ getLastChapterIndex က sortIndex ပဲ ပြန်ပေးတယ်။
  // ဒါကြောင့် queries.ts ကို မပြင်ဘဲ DB ကနေ တိုက်ရိုက်ယူပါမယ်။
  const lastChapter = await db.query.chapters.findFirst({
    where: (chapters, { eq }) => eq(chapters.novelId, novel.id),
    orderBy: (chapters, { desc }) => [desc(chapters.sortIndex)],
  });

  const suggestedIndex = lastChapter ? lastChapter.sortIndex + 1 : 1;
  const lastVolumeId = lastChapter?.volumeId || undefined;

  // volumes ယူမယ်
  const volumes = await getVolumesByNovelId(db, novel.id);

  // ==========================================
  // UI Rendering
  // ==========================================
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <ChapterForm
        novelId={novel.id}
        slug={slug}
        suggestedIndex={suggestedIndex}
        volumes={volumes}
        lastVolumeId={lastVolumeId}
      />
    </div>
  );
}
