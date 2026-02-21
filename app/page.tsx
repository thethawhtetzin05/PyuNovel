import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getNovels, getTotalNovelsCount, getTopNovelsByViews } from '../lib/resources/novels/queries';
import { drizzle } from 'drizzle-orm/d1';
import { novels } from "@/db/schema";
import CinematicHero from '@/components/CinematicHero';
import ContinueReadingBanner from '@/components/ContinueReading';

export const runtime = 'edge';

type Novel = typeof novels.$inferSelect;

export default async function Home(props: { searchParams: Promise<{ page?: string }> }) {
  // MUST force dynamic rendering for proper Cloudflare Edge execution in Next 15
  await headers();

  let allNovels: Novel[] = [];
  let totalNovels = 0;
  let spotlightNovels: Novel[] = [];
  let dbError = false;
  let currentPage = 1;

  try {
    const params = await props.searchParams;
    currentPage = Number(params?.page) || 1;
    const limits = 20;

    const { env } = getRequestContext();

    // Guard against missing DB binding on Cloudflare Pages
    if (!env || !env.DB) {
      dbError = true;
    } else {
      const db = drizzle(env.DB);
      [allNovels, totalNovels, spotlightNovels] = await Promise.all([
        getNovels(db, currentPage, limits),
        getTotalNovelsCount(db),
        getTopNovelsByViews(db, 6),
      ]);
    }
  } catch (error) {
    console.error("Home Page Data Fetch Error:", error);
    dbError = true;
  }

  if (dbError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] p-4">
        <div className="max-w-md w-full bg-[var(--surface)] border border-red-500/50 rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Runtime Connection Error</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Failed to process database or environment variables on the Cloudflare Edge Node.
          </p>
          <p className="text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
            Ensure that your D1 database binding is named exactly <strong>DB</strong> in Cloudflare settings.
          </p>
        </div>
      </div>
    );
  }

  const latestNovels = allNovels.slice(0, 18);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* ─── CONTINUE READING PORTAL ─────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full pointer-events-none drop-shadow-2xl">
        <div className="pointer-events-auto">
          <ContinueReadingBanner />
        </div>
      </div>

      <main className="max-w-[1440px] mx-auto px-4 md:px-8 pt-8 pb-32 space-y-20">
        {/* ─── HERO & ANNOUNCEMENTS ROW (WW Style) ───────────────── */}
        <section className="flex flex-col xl:flex-row gap-8">
          <div className="flex-1 min-w-0">
            {spotlightNovels.length > 0 ? (
              <CinematicHero novels={spotlightNovels} />
            ) : (
              <div className="w-full h-[320px] md:h-[400px] rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center">
                <span className="text-[var(--text-muted)]">No featured novels</span>
              </div>
            )}
          </div>

          {/* Announcements Sidebar */}
          <aside className="xl:w-[320px] shrink-0 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--foreground)]">Announcements</h2>
              <Link href="/news" className="text-sm font-medium text-[var(--action)] hover:text-[var(--action-hover)] transition-colors">View All</Link>
            </div>

            <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-5">
              {/* Dummy announcement for WuxiaWorld exact look */}
              <div className="flex gap-3 group cursor-pointer">
                <div className="w-10 h-10 bg-[var(--surface-2)] border border-[var(--border)] rounded flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-lg">📢</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--foreground)] leading-snug group-hover:text-[var(--action)] transition-colors line-clamp-2">
                    Welcome to the redesigned PyuNovel platform!
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">Just now</p>
                </div>
              </div>

              <div className="flex gap-3 group cursor-pointer">
                <div className="w-10 h-10 bg-[var(--surface-2)] border border-[var(--border)] rounded flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-lg">🏆</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--foreground)] leading-snug group-hover:text-[var(--action)] transition-colors line-clamp-2">
                    Monthly Writing Contest winners announced.
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">2 days ago</p>
                </div>
              </div>

              <div className="flex gap-3 group cursor-pointer">
                <div className="w-10 h-10 bg-[var(--surface-2)] border border-[var(--border)] rounded flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-lg">🔥</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--foreground)] leading-snug group-hover:text-[var(--action)] transition-colors line-clamp-2">
                    New VIP tiers are now available. Support your favorite authors!
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">1 week ago</p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        {/* ─── POPULAR THIS WEEK (WW Grid 5 cols) ───────────────── */}
        {spotlightNovels.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Popular This Week</h2>
            </div>
            <div className="grid grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-5 pb-4">
              {spotlightNovels.slice(0, 7).map((novel, idx) => (
                <Link href={`/novel/${novel.slug}`} key={novel.slug} className="group relative rounded-xl overflow-hidden bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--action)]/50 transition-colors shadow-sm hover:shadow-md">
                  <div className="relative w-full aspect-[2/3] bg-[var(--surface-2)]">
                    {novel.coverUrl ? (
                      <Image
                        src={novel.coverUrl}
                        alt={novel.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 1024px) 50vw, 20vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">📚</div>
                    )}
                    {/* Dark gradient for text overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent pointer-events-none" />

                    {/* Rank Number Overlay */}
                    <div className="absolute bottom-[18%] left-2 text-[80px] font-black italic leading-none pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity" style={{ color: "transparent", WebkitTextStroke: "2px rgba(255,255,255,0.7)" }}>
                      {idx + 1}
                    </div>

                    {/* Meta */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 pt-10">
                      <div className="flex items-center gap-1.5 mb-1 shadow-sm">
                        <span className="text-[var(--accent)] text-xs">👍</span>
                        <span className="text-white text-xs font-bold">100%</span>
                      </div>
                      <h3 className="text-white font-bold text-sm leading-snug line-clamp-2 drop-shadow-md">
                        {novel.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ─── NEW RELEASES ───────────────── */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">New Releases</h2>
            <Link href="/?page=1" className="text-sm font-medium text-[var(--action)] hover:text-[var(--action-hover)] transition-colors">View All &rarr;</Link>
          </div>

          <div className="grid grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-5 pb-4">
            {latestNovels.slice(0, 14).map((novel) => (
              <Link href={`/novel/${novel.slug}`} key={novel.slug} className="group flex flex-col gap-2">
                <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-[var(--surface-2)] border border-[var(--border)] group-hover:border-[var(--action)]/50 transition-all">
                  {novel.status && (
                    <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-sm text-white text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">
                      {novel.status}
                    </div>
                  )}
                  {novel.coverUrl ? (
                    <Image
                      src={novel.coverUrl}
                      alt={novel.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 50vw, 16vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📚</div>
                  )}
                </div>
                <div className="flex flex-col py-1">
                  <h3 className="text-[var(--foreground)] font-bold text-[13px] leading-snug line-clamp-2 group-hover:text-[var(--action)] transition-colors">
                    {novel.title}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 truncate font-medium">{novel.author}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}