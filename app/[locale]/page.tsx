import React from 'react';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getNovels, getTotalNovelsCount, getTopNovelsByViews } from '@/lib/resources/novels/queries';
import { drizzle } from 'drizzle-orm/d1';
import { novels } from "@/db/schema";
import CinematicHero from '@/components/home/CinematicHero';
import ContinueReadingBanner from '@/components/home/ContinueReading';
import { getTranslations } from 'next-intl/server';

export const runtime = 'edge';

interface Novel {
  id: number;
  title: string;
  slug: string;
  author: string;
  coverUrl: string | null;
  status?: "completed" | "ongoing" | "hiatus" | null;
  views?: number | null;
  description?: string | null;
}

export default async function Home({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const t = await getTranslations('Home');
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const limits = 20;

  const { env } = getRequestContext();
  const db = drizzle(env.DB);

  let allNovels: Novel[] = [];
  let totalNovels = 0;
  let spotlightNovels: Novel[] = [];

  try {
    [allNovels, totalNovels, spotlightNovels] = await Promise.all([
      getNovels(db, currentPage, limits),
      getTotalNovelsCount(db),
      getTopNovelsByViews(db, 6),
    ]);
  } catch (error) {
    console.error("Database Connection Error:", error);
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
                <span className="text-[var(--text-muted)]">{t('noFeaturedNovels')}</span>
              </div>
            )}
          </div>

          {/* Announcements Sidebar */}
          <aside className="xl:w-[320px] shrink-0 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--foreground)]">{t('announcements')}</h2>
              <Link href="/news" className="text-sm font-medium text-[var(--action)] hover:text-[var(--action-hover)] transition-colors">{t('viewAll')}</Link>
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
              <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">{t('popularThisWeek')}</h2>
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
            <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">{t('newReleases')}</h2>
            <Link href="/?page=1" className="text-sm font-medium text-[var(--action)] hover:text-[var(--action-hover)] transition-colors">{t('viewAll')} &rarr;</Link>
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