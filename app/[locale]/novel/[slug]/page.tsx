import { getRequestContext } from '@cloudflare/next-on-pages';
import { getNovelBySlug } from '@/lib/resources/novels/queries';
import { getChaptersByNovelId } from '@/lib/resources/chapters/queries';
import { getVolumesByNovelId } from '@/lib/resources/volumes/queries';
import { isNovelCollected } from '@/lib/resources/collections/queries';
import { getReviewsByNovelId, getUserReview } from '@/lib/resources/reviews/queries';
import { notFound } from 'next/navigation';
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import NovelTabs from './novel-tabs';
import CollectButton from './collect-button';
import ReviewSection from '@/components/novel/review-section';
import DownloadButton from '@/components/novel/OfflineDownloadButton';
import ViewTracker from './view-tracker';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from "@/db/schema"; // 👈 Schema import လုပ်ထားရမယ်
import type { Metadata, ResolvingMetadata } from 'next';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

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

  // React cache() ကြောင့် ဒုတိယအကြိမ် page component က ခေါ်ရင် DB ကို ထပ်မသွားတော့ပါဘူး
  const novel = await getNovelBySlug(db, slug);

  if (!novel) {
    return {
      title: 'Novel Not Found - nweoo',
    };
  }

  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: `${novel.title} - nweoo`,
    description: novel.description || `Read ${novel.title} by ${novel.author} on nweoo.`,
    openGraph: {
      title: novel.title,
      description: novel.description || `Read ${novel.title} by ${novel.author} on nweoo.`,
      url: `https://nweoo.com/novel/${novel.slug}`,
      siteName: 'nweoo',
      images: novel.coverUrl
        ? [{ url: novel.coverUrl, width: 800, height: 1200, alt: novel.title }]
        : previousImages,
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: novel.title,
      description: novel.description || `Read ${novel.title} by ${novel.author} on nweoo.`,
      images: novel.coverUrl ? [novel.coverUrl] : [],
    },
  };
}

export default async function NovelDetailsPage({ params }: Props) {
  const { env } = getRequestContext();
  const { slug } = await params;

  // Database Connection (Schema ထည့်ပေးထားပါတယ်)
  const db = drizzle(env.DB, { schema });

  // Novel Data ရှာမယ် (React cache ပါတဲ့အတွက် ပထမအကြိမ် metadata မှာ ခေါ်ထားရင် ချက်ချင်းရမယ်)
  const novel = await getNovelBySlug(db, slug);

  if (!novel) {
    notFound();
  }

  // Chapters ရှာမယ်
  const chapters = await getChaptersByNovelId(db, novel.id);
  const volumes = await getVolumesByNovelId(db, novel.id);

  // ပထမဆုံး အခန်းကို ရှာထားမယ် (Read Button အတွက်)
  const firstChapter = chapters.length > 0 ? chapters.sort((a, b) => a.sortIndex - b.sortIndex)[0] : null;

  // ❗ Type Error မတက်အောင် chapters ကို NovelTabs လိုချင်တဲ့ ပုံစံပြောင်းမယ်
  const formattedChapters = chapters.map((chapter) => ({
    ...chapter,
    id: chapter.id.toString(), // Number ကို String ပြောင်းမယ်
    isPaid: chapter.isPaid ?? false, // null ဖြစ်နေရင် false သတ်မှတ်မယ်
    volumeId: chapter.volumeId ?? null
  }));

  // Session စစ်မယ် (Owner ဟုတ်မဟုတ် သိဖို့)
  const auth = createAuth(env.DB);
  const session = await auth.api.getSession({ headers: await headers() });
  const isOwner = session?.user?.id === novel.ownerId;

  // Collection Status စစ်မယ်
  let isCollected = false;
  let userReview = null;

  if (session?.user) {
    isCollected = await isNovelCollected(db, session.user.id, novel.id);
    userReview = await getUserReview(db, novel.id, session.user.id);
  }

  // Reviews data ယူမယ်
  const reviews = await getReviewsByNovelId(db, novel.id);

  // Tags စာရင်းကို Array ပြောင်းမယ် (ကော်မာ၊ Space တွေ ရှင်းမယ်)
  const tagsList = novel.tags
    ? novel.tags.split(',').map(tag => tag.trim()).filter(t => t.length > 0)
    : [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 sm:py-12 pb-24 font-sans">
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
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[var(--foreground)] leading-[1.1] mb-4 tracking-tight">
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
            <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {(novel.views || 0).toLocaleString()} Views
            </span>

            {/* Tags Badges */}
            {tagsList.map((tag, index) => (
              <span key={index} className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[var(--surface-2)] text-[var(--foreground)] border border-[var(--border)]">
                {tag}
              </span>
            ))}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-3 mt-auto w-full md:w-auto">

            {/* A. READ BUTTON (Primary Action) */}
            {firstChapter ? (
              <Link
                href={`/novel/${novel.slug}/${firstChapter.sortIndex}`}
                className="w-full sm:w-auto h-12 px-8 rounded-xl bg-[var(--action)] hover:bg-[var(--action-hover)] text-white font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-[var(--action)]/20"
              >
                <span>📖 Read Now</span>
              </Link>
            ) : (
              <button disabled className="w-full sm:w-auto h-12 px-8 rounded-xl bg-[var(--surface-2)] text-[var(--text-muted)] font-bold cursor-not-allowed flex items-center justify-center gap-2">
                <span>🚫 No Chapters</span>
              </button>
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

      {/* TABS & DESCRIPTION SECTION */}
      <div className="mt-16 border-t border-gray-100 pt-8">
        <NovelTabs
          novelSlug={novel.slug}
          novelId={novel.id}
          description={novel.description || ''}
          chapters={formattedChapters}
          volumes={volumes}
          isOwner={isOwner}
        />
      </div>

      {/* REVIEWS SECTION */}
      <div className="mt-4">
        <ReviewSection
          novelId={novel.id}
          novelSlug={novel.slug}
          reviews={reviews as any}
          userReview={userReview}
          isLoggedIn={!!session?.user}
        />
      </div>

    </div>
  );
}