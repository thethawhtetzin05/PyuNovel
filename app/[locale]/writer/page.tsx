import { getRequestContext } from '@cloudflare/next-on-pages';
import { getNovelsByUserId } from '@/lib/resources/novels/queries';
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import NovelMenu from './novel-menu'; // ခုနက Client Component
import { drizzle } from 'drizzle-orm/d1';
import { Button } from '@/components/ui/button';

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
  const myNovels = await getNovelsByUserId(db, session.user.id);
  const t = await getTranslations('Writer');

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
            <div
              key={novel.id}
              className="group bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md transition-all flex flex-row items-center gap-4 hover:border-[var(--accent)] w-full relative"
            >
              {/* Cover Image (Thumbnail) */}
              <div className="w-16 h-24 shrink-0 bg-[var(--surface-2)] rounded-lg overflow-hidden border border-[var(--border)] relative">
                {novel.coverUrl && novel.coverUrl !== "/placeholder-cover.jpg" ? (
                  <img src={novel.coverUrl} alt={novel.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-muted)] bg-[var(--surface-2)]">
                    <span className="text-xl mb-1">📚</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">No Cover</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col gap-1">

                {/* Title & Badge Row */}
                <div className="flex flex-row items-center gap-2 min-w-0">
                  <Link href={`/writer/novels/${novel.slug}`} className="text-base sm:text-lg font-bold text-[var(--foreground)] truncate hover:text-[var(--action)] transition-colors min-w-0 flex-shrink">
                    {novel.title}
                  </Link>
                  <span className={`px-2 py-0.5 rounded text-[8px] sm:text-[10px] font-bold uppercase tracking-wide shrink-0 ${novel.status === 'ongoing' ? 'bg-green-100/10 text-green-600' : 'bg-blue-100/10 text-[var(--action)]'
                    }`}>
                    {novel.status}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-[var(--text-muted)] truncate min-w-0">
                  {novel.description || "No description provided."}
                </p>

                {/* Stats */}
                {/* Date & Views Row */}
                <div className="flex flex-row items-center gap-4 text-xs text-[var(--text-muted)] font-medium min-w-0 truncate mb-2">
                  <span>📅 {new Date(novel.createdAt || Date.now()).toLocaleDateString()}</span>
                  <span>👁️ 0 Views</span>
                </div>

                {/* Action Buttons Row */}
                <div className="flex flex-row items-center gap-3">
                  <Link
                    href={`/novel/${novel.slug}/create`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--action)]/10 text-[var(--action)] hover:bg-[var(--action)] hover:text-white transition-colors rounded-lg text-xs font-bold whitespace-nowrap shrink-0"
                  >
                    ✍️ Add Chapter
                  </Link>
                </div>
              </div>

              {/* Action Menu (3 Dots) */}
              <div className="shrink-0 flex items-center justify-center">
                <NovelMenu slug={novel.slug} novelId={novel.id.toString()} />
              </div>
            </div>
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