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
import ReaderView from '@/components/reader/reader-view';
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
  const htmlContent = chapter.content;

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
    <div className="min-h-screen w-full flex flex-col pb-12 overflow-x-hidden">
      {/* 🛠️ Reader Mode: Hide site header/footer ONLY on Mobile */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (max-width: 768px) {
            nav, footer, .bottom-nav { display: none !important; }
            main { padding-bottom: 0 !important; }
          }
        `}} />

      <ViewTracker slug={slug} chapterId={chapterId} />
      <ReadingTracker
        slug={slug}
        chapterId={chapterId}
        novelTitle={novel.title}
        chapterTitle={chapter.title}
      />

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
          <ReaderView
            content={htmlContent}
            chapterId={chapter.id.toString()}
            allChapters={allChapters}
            novelSlug={novel.slug}
            novelTitle={novel.title}
            title={chapter.title}
            date={formattedDate}
            prevIndex={prev?.sortIndex.toString() || null}
            nextIndex={next?.sortIndex.toString() || null}
          />
        )}
      </div>

      {/* 3. FOOTER NAVIGATION - Normal Desktop Experience */}
      <div className="hidden md:block w-full max-w-5xl mx-auto px-5 sm:px-8 md:px-12 py-8 mt-12 border-t border-current opacity-70">
        <ReaderNavigation
          novelSlug={novel.slug}
          prevIndex={prev ? prev.sortIndex.toString() : null}
          nextIndex={next ? next.sortIndex.toString() : null}
        />
        <ChapterCommentsTrigger />
      </div>

      {/* Mobile only Comments trigger if we want it separate */}
      <div className="md:hidden w-full max-w-5xl mx-auto px-5 py-8 mt-4 border-t border-current opacity-70">
        <ChapterCommentsTrigger />
      </div>
    </div>
  );
}