import { checkChapterAccess } from '@/lib/resources/chapters/unlocks';
import PaidChapterBlock from '@/components/reader/PaidChapterBlock';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getChapterForReader, getChaptersByNovelId } from '@/lib/resources/chapters/queries';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { drizzle } from 'drizzle-orm/d1';
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { saveReadingProgressAction } from '@/app/[locale]/collection/actions';
import ViewTracker from '../view-tracker';
import OfflineReaderWrapper from '@/components/reader/OfflineReaderWrapper';
import ReadingTracker from '@/components/reader/ReadingTracker';
import ChapterCommentsTrigger from '@/components/reader/ChapterCommentsTrigger';
import { Button } from '@/components/ui/button';
import ReaderNavigation from '@/components/reader/ReaderNavigation';

export const runtime = 'edge';

export default async function ChapterPage({ params }: { params: Promise<{ slug: string, chapterId: string }> }) {
  const { env } = getRequestContext();
  const db = drizzle(env.DB);
  const auth = createAuth(env.DB);

  const { slug, chapterId } = await params;

  // ✅ Run session + chapter data IN PARALLEL
  const [sessionResult, data] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getChapterForReader(db, slug, chapterId),
  ]);

  if (!data || !data.chapter) {
    notFound();
  }

  // Fetch chapters for TOC sidebar
  const allChapters = await getChaptersByNovelId(db, data.novel.id);

  const session = sessionResult;
  const { chapter, prev, next, novel } = data;
  const formattedDate = new Date(chapter.createdAt || new Date()).toLocaleDateString();

  // ✅ Fire-and-forget (don't await — doesn't need to block render)
  if (session?.user) {
    saveReadingProgressAction(novel.id, chapter.id).catch((e) =>
      console.error("Failed to save progress", e)
    );
  }

  // Pre-generate HTML content for initial server render
  const htmlContent = `
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
   `;

  // Paid Chapter Check
  const isOwner = session?.user?.id === novel.ownerId;
  let isLocked = false;

  if (chapter.isPaid && !isOwner) {
    if (!session?.user) {
      isLocked = true;
    } else {
      const unlocked = await checkChapterAccess(db, session.user.id, novel.id, chapter.id);
      if (!unlocked) {
        isLocked = true;
      }
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col pb-12">
      <ViewTracker slug={slug} />
      <ReadingTracker
        slug={slug}
        chapterId={chapterId}
        novelTitle={novel.title}
        chapterTitle={chapter.title}
      />

      <div className="w-full max-w-5xl mx-auto px-5 sm:px-8 md:px-12 py-4 flex justify-between items-center opacity-70">
        <Link
          href={`/novel/${novel.slug}`}
          className="font-bold text-sm hover:underline flex items-center gap-1"
        >
          ← {novel.title}
        </Link>
      </div>

      <div className="flex-grow w-full">
        {isLocked ? (
          <PaidChapterBlock
            chapterId={chapter.id}
            novelId={novel.id}
            chapterPrice={novel.chapterPrice || 0}
            slug={novel.slug}
            sortIndex={chapter.sortIndex.toString()}
          />
        ) : (
          <OfflineReaderWrapper
            chapterId={chapter.id.toString()}
            novelId={novel.id}
            novelTitle={novel.title}
            chapterTitle={chapter.title}
            content={htmlContent}
            rawContent={chapter.content}
            formattedDate={formattedDate}
            prevChapterId={prev ? prev.sortIndex.toString() : null}
            nextChapterId={next ? next.sortIndex.toString() : null}
            allChapters={allChapters}
            novelSlug={novel.slug}
          />
        )}
      </div>

      {/* 3. FOOTER NAVIGATION */}
      <div className="w-full max-w-5xl mx-auto px-5 sm:px-8 md:px-12 py-8 mt-12 border-t border-current opacity-70">
        <ReaderNavigation
          novelSlug={novel.slug}
          prevIndex={prev ? prev.sortIndex.toString() : null}
          nextIndex={next ? next.sortIndex.toString() : null}
        />

        <ChapterCommentsTrigger />
      </div>

    </div>
  );
}