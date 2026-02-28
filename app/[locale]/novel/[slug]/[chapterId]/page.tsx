import { getRequestContext } from '@cloudflare/next-on-pages';
import { getChapterForReader } from '@/lib/resources/chapters/queries';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { drizzle } from 'drizzle-orm/d1';
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { saveReadingProgressAction } from '@/app/[locale]/collection/actions';
import ViewTracker from '../view-tracker';
import ReaderView from '@/components/reader/reader-view';
import ReadingTracker from '@/components/reader/ReadingTracker';

export const runtime = 'edge';

export default async function ChapterPage({ params }: { params: Promise<{ slug: string, chapterId: string }> }) {
  const { env } = getRequestContext();
  const db = drizzle(env.DB);

  const { slug, chapterId } = await params;
  const data = await getChapterForReader(db, slug, chapterId);

  if (!data || !data.chapter) {
    notFound();
  }

  const { chapter, prev, next, novel } = data;
  const formattedDate = new Date(chapter.createdAt || new Date()).toLocaleDateString();

  // Call Reading Progress Tracker if user is logged in
  try {
    const auth = createAuth(env.DB);
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user) {
      await saveReadingProgressAction(novel.id, chapter.id);
    }
  } catch (e) {
    console.error("Failed to save progress", e);
  }

  return (
    // 💡 bg-white တွေ လုံးဝ မပါတော့ပါဘူး
    <div className="min-h-screen w-full flex flex-col pb-12">

      <ViewTracker slug={slug} />
      <ReadingTracker
        slug={slug}
        chapterId={chapterId}
        novelTitle={novel.title}
        chapterTitle={chapter.title}
      />

      {/* 1. TOP NAVIGATION (← စာဖတ်) */}
      <div className="w-full max-w-5xl mx-auto px-5 sm:px-8 md:px-12 py-4 flex justify-between items-center opacity-70">
        <Link
          href={`/novel/${novel.slug}`}
          className="font-bold text-sm hover:underline flex items-center gap-1"
        >
          ← {novel.title}
        </Link>
      </div>

      {/* 2. READER VIEW */}
      <div className="flex-grow w-full">
        <ReaderView content={`
             <div class="mb-12 px-4 md:px-0 border-b border-current opacity-70 pb-6 text-center md:text-left">
               <h1 class="text-3xl md:text-4xl font-black mt-2 mb-3 leading-tight text-inherit">
                   ${chapter.title}
               </h1>
               <div class="flex items-center justify-center md:justify-start gap-2 text-inherit opacity-60 text-sm font-sans">
                   <span>${formattedDate}</span>
               </div>
             </div>
             
             <div class="chapter-content">
               ${chapter.content}
             </div>
         `} />
      </div>

      {/* 3. FOOTER NAVIGATION */}
      <div className="w-full max-w-5xl mx-auto px-5 sm:px-8 md:px-12 py-8 mt-12 border-t border-current opacity-70">
        <div className="flex justify-between items-center gap-4">

          {prev ? (
            <Link
              href={`/novel/${novel.slug}/${prev.sortIndex}`}
              className="px-6 py-3 rounded-xl font-bold border border-current hover:opacity-100 opacity-80 transition-all text-sm md:text-base"
            >
              ← Prev
            </Link>
          ) : (
            <button disabled className="px-6 py-3 rounded-xl font-bold border border-current opacity-30 cursor-not-allowed text-sm md:text-base">
              Prev
            </button>
          )}

          {next ? (
            <Link
              href={`/novel/${novel.slug}/${next.sortIndex}`}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 hover:shadow-lg transition-all text-sm md:text-base border-none"
            >
              Next →
            </Link>
          ) : (
            <Link
              href={`/novel/${novel.slug}`}
              className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black hover:shadow-lg transition-all text-sm md:text-base border-none"
            >
              Finish ✓
            </Link>
          )}

        </div>
      </div>

    </div>
  );
}