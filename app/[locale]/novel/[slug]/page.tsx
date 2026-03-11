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
import DownloadButton from '@/components/novel/OfflineDownloadButton';
import ViewTracker from './view-tracker';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from "@/db/schema"; // 👈 Schema import လုပ်ထားရမယ်
import type { Metadata, ResolvingMetadata } from 'next';
import { Button } from "@/components/ui/button";

export const runtime = 'edge';
export const dynamic = 'force-dynamic'; // Required: page uses headers() for session check

type Props = {
  params: Promise<{ slug: string }>
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

export default async function NovelDetailsPage({ params }: Props) {
  const { env } = getRequestContext();
  const { slug } = await params;

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

  // Tags စာရင်းကို Array ပြောင်းမယ် (ကော်မာ၊ Space တွေ ရှင်းမယ်)
  const tagsList = novel.tags
    ? novel.tags.split(',').map(tag => tag.trim()).filter(t => t.length > 0)
    : [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 font-sans overflow-x-hidden md:overflow-x-visible w-full min-w-0">
      <ViewTracker slug={slug} />

      {/* HEADER INFO SECTION */}
      <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">

        {/* 1. Cover Image (Shadow & Rounded Corners) */}
        <div className="w-44 md:w-56 aspect-[2/3] bg-gray-100 rounded-2xl shadow-2xl shrink-0 border border-gray-200 overflow-hidden relative mx-auto md:mx-0 transform hover:scale-[1.02] transition-transform duration-300">
          {novel.coverUrl && novel.coverUrl !== "/placeholder-cover.jpg" ? (
            <Image
              src={novel.coverUrl}
              alt={novel.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 176px, 224px"
              priority
            />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full text-gray-400 bg-gray-50">
              <span className="text-4xl mb-2">📚</span>
              <span className="text-xs font-bold uppercase tracking-widest">No Cover</span>
            </div>
          )}
        </div>

        {/* 2. Novel Details Text */}
        <div className="flex flex-col flex-1 py-1 text-center md:text-left w-full">

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[var(--foreground)] leading-snug md:leading-tight mb-4 tracking-tight break-words">
            {novel.title}
          </h1>

          {/* Author */}
          <p className="text-lg text-[var(--text-muted)] font-medium mb-6 flex items-center justify-center md:justify-start gap-2">
            <span className="opacity-70">By</span>
            <Link
              href={`/author/${novel.ownerId}`}
              className="text-[var(--action)] font-bold hover:underline transition-all cursor-pointer"
            >
              {novel.author}
            </Link>
          </p>

          {/* Tags & Status Badges */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-8">
            {/* Status Badge (❗ lowercase နဲ့ ပြောင်းစစ်ထားတယ်) */}
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white shadow-sm ${novel.status === 'ongoing' ? 'bg-emerald-500' : 'bg-blue-600'}`}>
              {novel.status || 'Ongoing'}
            </span>

            {/* Views Badge */}
            <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1 shadow-sm whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {(novel.views || 0).toLocaleString()} Views
            </span>

            {/* Collectors Badge */}
            <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1 shadow-sm whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              {collectorCount.toLocaleString()} Collectors
            </span>

            {/* Tags Badges */}
            {tagsList.map((tag, index) => (
              <span key={index} className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[var(--surface-2)] text-[var(--foreground)] border border-[var(--border)] whitespace-nowrap">
                {tag}
              </span>
            ))}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-3 mt-auto w-full md:w-auto">

            {/* A. READ BUTTON (Primary Action) */}
            {firstChapter ? (
              <Button asChild variant="premium" size="lg" className="w-full sm:w-auto">
                <Link href={`/novel/${novel.slug}/${firstChapter.sortIndex}`}>
                  📖 Read Now
                </Link>
              </Button>
            ) : (
              <Button disabled variant="secondary" size="lg" className="w-full sm:w-auto">
                🚫 No Chapters
              </Button>
            )}

            {/* B. COLLECT BUTTON (Secondary Action) */}
            {session?.user ? (
              <CollectButton novelId={novel.id} initialCollected={isCollected} slug={novel.slug} />
            ) : (
              <Link href="/sign-in" className="w-full sm:w-auto h-12 px-6 rounded-xl bg-[var(--surface-2)] text-[var(--foreground)] font-bold border border-[var(--border)] hover:border-[var(--action)] hover:text-[var(--action)] hover:bg-[var(--surface)] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                </svg>
                <span>Collect</span>
              </Link>
            )}

            {/* C. DOWNLOAD BUTTON (App-only — hidden on web) */}
            <DownloadButton slug={novel.slug} />

          </div>

        </div>
      </div>

      {/* TABS & CONTENT SECTION */}
      <div className="mt-16 border-t border-[var(--border)] pt-8">
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
        />
      </div>

    </div>
  );
}