import { getRequestContext } from '@cloudflare/next-on-pages';
import { getUserCollections } from '@/lib/resources/collections/queries';
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { drizzle } from 'drizzle-orm/d1';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function CollectionPage() {
    const { env } = getRequestContext();
    const auth = createAuth(env.DB);
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect('/sign-in');
    }

    const db = drizzle(env.DB);
    const myCollections = await getUserCollections(db, session.user.id);

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-[var(--foreground)]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>My Collection</h1>
                    <p className="text-[var(--text-muted)] mt-2">Resume reading your collected novels.</p>
                </div>
                <Link
                    href="/ranking"
                    className="btn-primary px-5 py-2.5 rounded-xl font-bold transition-transform active:scale-95 text-sm inline-block"
                >
                    Discover More
                </Link>
            </div>

            {/* Collection List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myCollections.length > 0 ? (
                    myCollections.map((item) => (
                        <Link
                            key={item.collectionId}
                            href={item.lastReadChapterId ? `/novel/${item.novel.slug}/chapter/${item.lastReadChapterId}` : `/novel/${item.novel.slug}`}
                            className="group bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md transition-all flex items-center gap-5 hover:border-[var(--accent)]"
                        >
                            {/* Cover Image */}
                            <div className="w-16 h-24 shrink-0 bg-[var(--surface-2)] rounded-lg overflow-hidden border border-[var(--border)] relative">
                                {item.novel.coverUrl && item.novel.coverUrl !== "/placeholder-cover.jpg" ? (
                                    <img src={item.novel.coverUrl} alt={item.novel.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-muted)] bg-[var(--surface-2)]">
                                        <span className="text-xl mb-1">📚</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider">No Cover</span>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-bold text-[var(--foreground)] truncate group-hover:text-[var(--action)] transition-colors">
                                        {item.novel.title}
                                    </h3>
                                </div>

                                <div className="text-xs text-[var(--text-muted)] mb-2">
                                    <span className="font-semibold text-[var(--action)]">
                                        {item.novel.status === 'ongoing' ? 'Ongoing' : 'Completed'}
                                    </span>
                                    <span className="mx-2">•</span>
                                    <span>{item.novel.author}</span>
                                </div>

                                <div className="mt-2 text-sm font-medium">
                                    {item.lastReadChapterTitle ? (
                                        <span className="text-[var(--foreground)]">
                                            <span className="text-[var(--text-muted)] mr-1">Last Read:</span>
                                            {item.lastReadChapterTitle}
                                        </span>
                                    ) : (
                                        <span className="text-[var(--text-muted)] italic">Not started yet</span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="col-span-1 md:col-span-2 text-center py-20 bg-[var(--surface-2)] rounded-3xl border border-dashed border-[var(--border)]">
                        <span className="text-4xl block mb-4">📚</span>
                        <p className="text-[var(--text-muted)] font-medium mb-4">Your collection is empty.</p>
                        <Link href="/" className="text-[var(--action)] font-bold hover:underline">Start browsing novels &rarr;</Link>
                    </div>
                )}
            </div>

        </div>
    );
}
