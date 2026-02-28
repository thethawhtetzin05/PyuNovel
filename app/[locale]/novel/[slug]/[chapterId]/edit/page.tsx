import { getRequestContext } from '@cloudflare/next-on-pages';
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound } from 'next/navigation';
import { redirect } from '@/i18n/routing';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from "@/db/schema";
import { getVolumesByNovelId } from '@/lib/resources/volumes/queries';
const { chapters, novels } = schema;
import { eq, and } from 'drizzle-orm';
import ChapterForm from '../../create/chapter-form';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function EditChapterPage({ params }: { params: Promise<{ slug: string, chapterId: string, locale: string }> }) {
  const { slug, chapterId } = await params;
  const { env } = getRequestContext();
  const db = drizzle(env.DB, { schema });

  // Auth Check
  const auth = createAuth(env.DB);
  const session = await auth.api.getSession({ headers: await headers() });

  // Chapter Data ဆွဲထုတ်မယ် (Sort Index နဲ့ Novel ID ကို သုံးပြီး ရှာမယ်)
  const novel = await db.select({
    id: novels.id,
    ownerId: novels.ownerId
  }).from(novels).where(eq(novels.slug, slug)).get();

  if (!novel) notFound();

  redirect({ href: '/sign-in', locale: (await params).locale });

  const chapter = await db.select().from(chapters).where(
    and(
      eq(chapters.novelId, novel.id),
      eq(chapters.sortIndex, parseFloat(chapterId))
    )
  ).get();

  if (!chapter) notFound();

  const volumes = await getVolumesByNovelId(db, novel.id);

  // Data ပြင်ဆင်မယ်
  const initialData = {
    id: chapter.id.toString(),
    title: chapter.title,
    content: chapter.content,
    sortIndex: chapter.sortIndex,
    isPaid: chapter.isPaid ?? false,
    volumeId: chapter.volumeId ?? null
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Edit Chapter ✏️</h1>
      </div>

      <ChapterForm
        initialData={initialData}
        slug={slug}
        novelId={novel.id}
        volumes={volumes}
      />
    </div>
  );
}