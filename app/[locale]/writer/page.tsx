import { getRequestContext } from '@cloudflare/next-on-pages';
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { drizzle } from 'drizzle-orm/d1';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { novels } from '@/db/schema';
import { desc, sql } from 'drizzle-orm';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { env } = getRequestContext();
  const auth = createAuth(env.DB);
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect({ href: '/sign-in', locale: (await params).locale });
    return null;
  }

  const db = drizzle(env.DB);
  const t = await getTranslations('Writer');

  /**
   * ✅ OPTIMIZATION: Correlated subqueries instead of double LEFT JOIN
   * Double LEFT JOIN (novels × collections × chapters) creates a cartesian product,
   * causing row reads = novel_count × avg_chapter_count (e.g. 12 × 27 = 324).
   * Correlated subqueries run per-novel but use indexed FK columns (novel_id),
   * so row reads = novel_count × index_lookups only.
   */
  const myNovels = await db
    .select({
      id: novels.id,
      title: novels.title,
      slug: novels.slug,
      status: novels.status,
      coverUrl: novels.coverUrl,
      views: novels.views,
      updatedAt: novels.updatedAt,
      collectorCount: sql<number>`(
        SELECT CAST(count(*) AS INTEGER)
        FROM collections
        WHERE collections.novel_id = ${novels.id}
      )`,
      chapterCount: sql<number>`(
        SELECT CAST(count(*) AS INTEGER)
        FROM chapters
        WHERE chapters.novel_id = ${novels.id}
      )`,
    })
    .from(novels)
    .where(sql`${novels.ownerId} = ${session.user.id}`)
    .orderBy(desc(novels.updatedAt))
    .all();

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">

      {/* Header Area */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--foreground)]">{t('title')}</h1>
          <p className="text-[var(--text-muted)] mt-1">{t('description')}</p>
        </div>
        <Button asChild variant="premium" size="default" className="font-sans rounded-full">
          <Link href="/novel/create">
            {t('newNovel')}
          </Link>
        </Button>
      </div>

      {/* Novel List */}
      <div className="flex flex-col gap-4 w-full max-w-full">
        {myNovels.length > 0 ? (
          myNovels.map((novel) => (
            <Link key={novel.id} href={`/writer/novels/${novel.slug}`}>
              <Card className="overflow-hidden border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:shadow-md transition-all duration-200 group">
                <CardContent className="p-4 flex flex-row items-center gap-4">
                  {/* Cover Image (Thumbnail) */}
                  <div className="w-16 h-24 shrink-0 bg-[var(--surface-2)] rounded-lg overflow-hidden border border-[var(--border)] relative shadow-sm">
                    {novel.coverUrl && novel.coverUrl !== "/placeholder-cover.jpg" ? (
                      <img src={novel.coverUrl} alt={novel.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-muted)] bg-[var(--surface-2)]">
                        <span className="text-xl mb-1">📚</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">No Cover</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    {/* Title & Badge Row */}
                    <div className="flex flex-row items-center justify-between gap-2 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] truncate group-hover:text-[var(--action)] transition-colors">
                        {novel.title}
                      </h3>
                      <Badge variant="outline" className={`text-xs sm:text-sm uppercase font-bold tracking-wide border-0 py-1 px-3 shrink-0 ${novel.status === 'ongoing' ? 'bg-green-500/10 text-green-600' :
                        novel.status === 'completed' ? 'bg-blue-500/10 text-blue-600' :
                          'bg-orange-500/10 text-orange-600'
                        }`}>
                        {novel.status}
                      </Badge>
                    </div>

                    {/* Stats Grid - General View WITHOUT Icons */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-y border-[var(--border)]/50">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Views</span>
                        <div className="text-sm font-bold text-[var(--foreground)]">
                          {novel.views.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Collections</span>
                        <div className="text-sm font-bold text-[var(--foreground)]">
                          {novel.collectorCount.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Chapters</span>
                        <div className="text-sm font-bold text-[var(--foreground)]">
                          {novel.chapterCount}
                        </div>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Last Update</span>
                        <div className="text-sm font-bold text-[var(--foreground)]">
                          {new Date(novel.updatedAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          /* ဝတ္ထု မရှိသေးရင် ပြမယ့်နေရာ */
          <div className="text-center py-20 bg-[var(--surface-2)] rounded-3xl border border-dashed border-[var(--border)]">
            <p className="text-[var(--text-muted)] font-medium mb-4">{t('noNovels')}</p>
            <Link href="/novel/create" className="text-[var(--action)] font-bold hover:underline">{t('startWriting')}</Link>
          </div>
        )}
      </div>

    </div>
  );
}