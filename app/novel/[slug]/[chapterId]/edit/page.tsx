import { getRequestContext } from '@cloudflare/next-on-pages';
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from 'next/navigation';
import { updateChapterAction } from './actions';
import { drizzle } from 'drizzle-orm/d1';
import { chapters } from '@/db/schema'; // Import Schema
import { eq } from 'drizzle-orm';
import ChapterForm from '../../create/chapter-form';

export const runtime = 'edge';

export default async function EditChapterPage({ params }: { params: Promise<{ slug: string, chapterId: string }> }) {
  const { slug, chapterId } = await params;
  const { env } = getRequestContext();
  const db = drizzle(env.DB);

  // Auth Check
  const auth = createAuth(env.DB);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/sign-in');

  // Chapter Data ဆွဲထုတ်မယ်
  const chapter = await db.select().from(chapters).where(eq(chapters.id, parseInt(chapterId, 10))).get();

  if (!chapter) notFound();

  // Data ပြင်ဆင်မယ်
  const initialData = {
    id: chapter.id.toString(),
    title: chapter.title,
    content: chapter.content,
    sortIndex: chapter.sortIndex,
    isPaid: chapter.isPaid ?? false
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Edit Chapter ✏️</h1>
      </div>

      <ChapterForm
        initialData={initialData}
        slug={slug}
        saveAction={updateChapterAction}
      />
    </div>
  );
}