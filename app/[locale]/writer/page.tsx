import { getRequestContext } from '@cloudflare/next-on-pages';
import { getNovelsByUserId } from '@/lib/resources/novels/queries';
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, Link } from '@/i18n/routing';
import NovelMenu from './novel-menu'; // ခုနက Client Component
import { drizzle } from 'drizzle-orm/d1';

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

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">

      {/* Header Area */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--foreground)]">Author Dashboard</h1>
          <p className="text-[var(--text-muted)] mt-1">Manage your stories and chapters.</p>
        </div>
        <Link
          href="/novel/create"
          className="btn-primary px-5 py-2.5 rounded-xl font-bold transition-transform active:scale-95 text-sm inline-block"
        >
          + New Novel
        </Link>
      </div>

      {/* Novel List */}
      <div className="grid gap-4">
        {myNovels.length > 0 ? (
          myNovels.map((novel) => (
            <div
              key={novel.id}
              className="group bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md transition-all flex items-center gap-5 hover:border-[var(--accent)]"
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
              <div className="flex-1 min-w-0" style={{ minWidth: 0 }}>
                <div className="flex items-center gap-2 mb-1 w-full" style={{ minWidth: 0 }}>
                  <h3 className="text-lg font-bold text-[var(--foreground)] truncate group-hover:text-[var(--action)] transition-colors flex-1" style={{ minWidth: 0 }}>
                    <Link href={`/novel/${novel.slug}`} className="block truncate w-full" style={{ minWidth: 0 }}>{novel.title}</Link>
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shrink-0 ${novel.status === 'ongoing' ? 'bg-green-100/10 text-green-600' : 'bg-blue-100/10 text-[var(--action)]'
                    }`}>
                    {novel.status}
                  </span>
                </div>

                <p className="text-sm text-[var(--text-muted)] line-clamp-1 mb-2">
                  {novel.description || "No description provided."}
                </p>

                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] font-medium">
                  <span>📅 {new Date(novel.createdAt || Date.now()).toLocaleDateString()}</span>
                  <span>👁️ 0 Views</span>
                </div>
              </div>

              {/* Action Menu (3 Dots) */}
              <div className="shrink-0">
                <NovelMenu slug={novel.slug} novelId={novel.id.toString()} />
              </div>
            </div>
          ))
        ) : (
          /* ဝတ္ထု မရှိသေးရင် ပြမယ့်နေရာ */
          <div className="text-center py-20 bg-[var(--surface-2)] rounded-3xl border border-dashed border-[var(--border)]">
            <p className="text-[var(--text-muted)] font-medium mb-4">You haven't written any novels yet.</p>
            <Link href="/novel/create" className="text-[var(--action)] font-bold hover:underline">Start Writing Now &rarr;</Link>
          </div>
        )}
      </div>

    </div>
  );
}