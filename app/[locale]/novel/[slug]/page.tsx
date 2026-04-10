import { Suspense } from 'react';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getNovelBySlug } from '@/lib/resources/novels/queries';
import { getChaptersByNovelId } from '@/lib/resources/chapters/queries';
import { getVolumesByNovelId } from '@/lib/resources/volumes/queries';
import { isNovelCollected, getCollectionCountByNovelId } from '@/lib/resources/collections/queries';
import { getReviewsByNovelId, getUserReview } from '@/lib/resources/reviews/queries';
import { notFound } from 'next/navigation';
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import NovelTabs from './novel-tabs';
import CollectButton from './collect-button';
import ViewTracker from './view-tracker';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import AdUnit from '@/components/ads/AdUnit';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from "@/db/schema"; // 👈 Schema import လုပ်ထားရမယ်
import type { Metadata, ResolvingMetadata } from 'next';
import { Button } from "@/components/ui/button";

export const runtime = 'edge';
export const dynamic = 'force-dynamic'; // Required: page uses headers() for session check

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const { env } = getRequestContext();
  const db = drizzle(env.DB, { schema });

  const novel = await getNovelBySlug(db, slug);

  if (!novel) {
    return { title: 'Novel Not Found - PyuNovel' };
  }

  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: `${novel.title} - PyuNovel`,
    description: novel.description || `Read ${novel.title} by ${novel.author} on PyuNovel.`,
    openGraph: {
      title: novel.title,
      description: novel.description || `Read ${novel.title} by ${novel.author} on PyuNovel.`,
      url: `https://pyunovel.pages.dev/novel/${novel.slug}`,
      siteName: 'PyuNovel',
      images: novel.coverUrl
        ? [{ url: novel.coverUrl, width: 800, height: 1200, alt: novel.title }]
        : previousImages,
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: novel.title,
      description: novel.description || `Read ${novel.title} by ${novel.author} on PyuNovel.`,
      images: novel.coverUrl ? [novel.coverUrl] : [],
    },
  };
}

export default async function NovelDetailsPage({ params, searchParams }: Props) {
  const { env } = getRequestContext();
  const { slug } = await params;
  const { tab } = await searchParams;

  const db = drizzle(env.DB, { schema });

  // ✅ STEP 1: Run session check + all public queries IN PARALLEL
  const auth = createAuth(env.DB);
  const [novel, sessionResult] = await Promise.all([
    getNovelBySlug(db, slug),
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (!novel) notFound();

  // ✅ STEP 2: Run all remaining queries IN PARALLEL (no more sequential waiting)
  const userId = sessionResult?.user?.id;
  const [chapters, volumes, reviews, collectorCount, isCollected, userReview] = await Promise.all([
    getChaptersByNovelId(db, novel.id),
    getVolumesByNovelId(db, novel.id),
    getReviewsByNovelId(db, novel.id),
    getCollectionCountByNovelId(db, novel.id),
    userId ? isNovelCollected(db, userId, novel.id) : Promise.resolve(false),
    userId ? getUserReview(db, novel.id, userId) : Promise.resolve(null),
  ]);

  const session = sessionResult;
  const isOwner = session?.user?.id === novel.ownerId;

  // ပထမဆုံး အခန်းကို ရှာထားမယ် (Read Button အတွက်)
  const firstChapter = chapters.length > 0 ? chapters.sort((a, b) => a.sortIndex - b.sortIndex)[0] : null;

  // ❗ Type Error မတက်အောင် chapters ကို NovelTabs လိုချင်တဲ့ ပုံစံပြောင်းမယ်
  const formattedChapters = chapters.map((chapter) => ({
    ...chapter,
    id: chapter.id.toString(), // Number ကို String ပြောင်းမယ်
    isPaid: chapter.isPaid ?? false, // null ဖြစ်နေရင် false သတ်မှတ်မယ်
    volumeId: chapter.volumeId ?? null
  }));
  // Tags စာရင်းကို Array ပြောင်းမယ် (ကော်မာ၊ Space တွေ ရှင်းမယ်)
  const tagsList = novel.tags
    ? novel.tags.split(',').map(tag => tag.trim()).filter(t => t.length > 0)
    : [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 font-sans overflow-x-hidden md:overflow-x-visible w-full min-w-0">
      <ViewTracker slug={slug} />

      {/* HEADER INFO SECTION */}
      <div className="flex flex-col gap-4 md:gap-12">

        {/* Title - Mobile View (Shown only on small screens) */}
        <h1 className="block md:hidden text-2xl sm:text-3xl font-black text-[var(--foreground)] leading-tight tracking-tight break-words">
          {novel.title}
        </h1>

        <div className="flex flex-row gap-5 md:gap-12 items-start w-full">

          {/* 1. Cover Image (Shadow & Rounded Corners) */}
          <div className="w-32 sm:w-44 md:w-56 aspect-[2/3] bg-gray-100 rounded-xl md:rounded-2xl shadow-xl md:shadow-2xl shrink-0 border border-gray-200 overflow-hidden relative transform hover:scale-[1.02] transition-transform duration-300">
            {novel.coverUrl && novel.coverUrl !== "/placeholder-cover.jpg" ? (
              <Image
                src={novel.coverUrl}
                alt={novel.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 128px, 224px"
                priority
              />
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full text-gray-400 bg-gray-50">
                <span className="text-4xl mb-2">📚</span>
                <span className="text-xs font-bold uppercase tracking-widest text-center px-2">No Cover</span>
              </div>
            )}
          </div>

          {/* 2. Novel Details Text */}
          <div className="flex flex-col flex-1 min-w-0 py-0 md:py-1 text-left w-full">

            {/* Title - Desktop View (Hidden on mobile as it's moved above) */}
            <h1 className="hidden md:block text-3xl md:text-5xl font-black text-[var(--foreground)] leading-tight mb-4 tracking-tight break-words">
              {novel.title}
            </h1>

            {/* Details List */}
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 md:gap-y-4 text-[15px] sm:text-base mb-2 md:mb-6">
              <span className="text-[var(--text-muted)] font-medium">Author:</span>
              <Link
                href={`/author/${novel.ownerId}`}
                className="text-[var(--action)] font-bold hover:underline transition-all cursor-pointer truncate"
              >
                {novel.author}
              </Link>

              <span className="text-[var(--text-muted)] font-medium">Status:</span>
              <span className={`font-bold capitalize ${novel.status === 'ongoing' ? 'text-emerald-500' : 'text-blue-600'}`}>
                {novel.status || 'Ongoing'}
              </span>

              <span className="text-[var(--text-muted)] font-medium">Statistics:</span>
              <span className="font-bold">
                {(novel.views || 0).toLocaleString()} views & {collectorCount.toLocaleString()} collections
              </span>

              <span className="text-[var(--text-muted)] font-medium">Tags:</span>
              <span className="font-semibold text-[var(--foreground)] line-clamp-2 md:line-clamp-none">
                {tagsList.length > 0 ? tagsList.join(', ') : 'No tags'}
              </span>

              <span className="text-[var(--text-muted)] font-medium">Updated:</span>
              <span className="font-semibold">
                {novel.updatedAt ? new Intl.DateTimeFormat('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                }).format(new Date(novel.updatedAt)) : 'Unknown'}
              </span>
            </div>

            {/* ACTION BUTTONS - Desktop (Hidden on mobile) */}
            <div className="hidden md:flex flex-row gap-3 mt-auto w-full">
              {/* A. READ BUTTON (Primary Action) */}
              <div className="flex-1">
                {firstChapter ? (
                  <Button asChild variant="premium" size="lg" className="w-full text-base font-bold h-12">
                    <Link href={`/novel/${novel.slug}/${firstChapter.sortIndex}`}>
                      📖 Read Now
                    </Link>
                  </Button>
                ) : (
                  <Button disabled variant="secondary" size="lg" className="w-full text-base h-12 opacity-50">
                    🚫 No Chapters
                  </Button>
                )}
              </div>

              {/* B. COLLECT BUTTON (Secondary Action) */}
              <div className="flex-1">
                {session?.user ? (
                  <CollectButton novelId={novel.id} initialCollected={isCollected} slug={novel.slug} />
                ) : (
                  <Button asChild variant="outline" size="lg" className="w-full h-12 bg-primary/5 dark:bg-primary/10 text-primary shadow-xl border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-primary font-bold flex items-center justify-center gap-2 transition-none text-base">
                    <Link href="/sign-in">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                      </svg>
                      <span>Collect</span>
                    </Link>
                  </Button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ACTION BUTTONS - Mobile (Under both image and text) */}
        <div className="flex md:hidden flex-row gap-3 w-full">
          {/* A. READ BUTTON */}
          <div className="flex-1">
            {firstChapter ? (
              <Button asChild variant="premium" size="lg" className="w-full text-sm font-bold h-12">
                <Link href={`/novel/${novel.slug}/${firstChapter.sortIndex}`}>
                  📖 Read Now
                </Link>
              </Button>
            ) : (
              <Button disabled variant="secondary" size="lg" className="w-full text-sm h-12 opacity-50">
                🚫 No Chapters
              </Button>
            )}
          </div>

          {/* B. COLLECT BUTTON */}
          <div className="flex-1">
            {session?.user ? (
              <CollectButton novelId={novel.id} initialCollected={isCollected} slug={novel.slug} />
            ) : (
              <Button asChild variant="outline" size="lg" className="w-full h-12 bg-primary/5 dark:bg-primary/10 text-primary shadow-xl border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-primary font-bold flex items-center justify-center gap-2 transition-none text-sm">
                <Link href="/sign-in">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                  <span>Collect</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* TABS & CONTENT SECTION */}
      <div className="mt-10 border-t border-[var(--border)] pt-8">
        <AdUnit type="320x50" />
        <NovelTabs
          novelSlug={novel.slug}
          novelId={novel.id}
          description={novel.description || ''}
          chapters={formattedChapters}
          volumes={volumes}
          isOwner={isOwner}
          reviews={reviews as any}
          userReview={userReview}
          isLoggedIn={!!session?.user}
          defaultTab={tab || 'about'}
        />
      </div>

    </div>
  );
}
