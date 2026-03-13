import React from 'react';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getNovels, getTotalNovelsCount, getTopNovelsByViews } from '@/lib/resources/novels/queries';
import { getLatestChapters } from '@/lib/resources/chapters/queries';
import { getLatestAnnouncements } from '@/lib/resources/announcements/queries';
import { drizzle } from 'drizzle-orm/d1';
import { novels } from "@/db/schema";
import CinematicHero from '@/components/home/CinematicHero';
import LatestChapters from '@/components/home/LatestChapters';
import ContinueReadingBanner from '@/components/home/ContinueReading';
import { NovelCard } from '@/components/novel/NovelCard';
import { getTranslations } from 'next-intl/server';

export const runtime = 'edge';
export const revalidate = 60; // Cache at Cloudflare edge for 60s — huge speed boost

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
  let latestChapterList: any[] = [];
  let announcementList: any[] = [];

  try {
    [allNovels, totalNovels, spotlightNovels, latestChapterList, announcementList] = await Promise.all([
      getNovels(db, currentPage, limits),
      getTotalNovelsCount(db),
      getTopNovelsByViews(db, 6),
      getLatestChapters(db, 10),
      getLatestAnnouncements(db, 3),
    ]);
  } catch (error) {
    console.error("Database Connection Error:", error);
  }

  const latestNovels = allNovels.slice(0, 18);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* ─── CONTINUE READING PORTAL ─────────────────────────────── */}
      <div className="fixed md:bottom-6 bottom-[70px] right-6 z-50 max-w-sm w-full pointer-events-none drop-shadow-2xl">
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

              {announcementList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] text-sm py-8">
                  No announcements yet.
                </div>
              ) : (
                announcementList.map((announcement) => (
                  <div key={announcement.id} className="flex gap-3 group cursor-pointer">
                    <div className="w-10 h-10 bg-[var(--surface-2)] border border-[var(--border)] rounded flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-lg">{announcement.icon || '📢'}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--foreground)] leading-snug group-hover:text-[var(--action)] transition-colors line-clamp-2">
                        {announcement.title}
                      </h3>
                      {announcement.content && (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">{announcement.content}</p>
                      )}
                      <p className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}

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
                <NovelCard
                  key={novel.slug}
                  novel={novel as any}
                  variant="ranked"
                  rank={idx + 1}
                />
              ))}
            </div>
          </section>
        )}

        {/* ─── LATEST CHAPTERS ───────────────── */}
        {latestChapterList.length > 0 && (
          <LatestChapters chapters={latestChapterList} />
        )}

        {/* ─── NEW RELEASES ───────────────── */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">{t('newReleases')}</h2>
            <Link href="/?page=1" className="text-sm font-medium text-[var(--action)] hover:text-[var(--action-hover)] transition-colors">{t('viewAll')} &rarr;</Link>
          </div>

          <div className="grid grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-5 pb-4">
            {latestNovels.slice(0, 14).map((novel) => (
              <NovelCard
                key={novel.slug}
                novel={novel as any}
              />
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}