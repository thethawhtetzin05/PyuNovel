import { getRequestContext } from '@cloudflare/next-on-pages';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from "@/db/schema";
import { getNovelsByUserId } from '@/lib/resources/novels/queries';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';

export const runtime = 'edge';

export default async function AuthorProfilePage({ params }: { params: Promise<{ id: string; locale: string }> }) {
    const { env } = getRequestContext();
    const { id: authorId } = await params;
    const db = drizzle(env.DB, { schema });

    // 1. Get Author Data
    const author = await db.query.user.findFirst({
        where: (user, { eq }) => eq(user.id, authorId)
    });

    if (!author) {
        notFound();
    }

    // 2. Get Author's Novels
    const authorNovels = await getNovelsByUserId(db, author.id);

    // Date Formatting Helper
    const joinedDate = new Date(author.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 min-h-screen font-sans">
            {/* 1. Header & Profile Card */}
            <div className="bg-[var(--surface)] rounded-3xl p-8 sm:p-10 shadow-xl border border-[var(--border)] mb-12 flex flex-col sm:flex-row items-center sm:items-start gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[var(--action)] opacity-10 blur-3xl pointer-events-none"></div>

                {/* Avatar */}
                <div className="shrink-0 relative z-10">
                    {author.image ? (
                        <img
                            src={author.image}
                            alt={author.name}
                            className="w-32 h-32 rounded-full object-cover border-4 border-[var(--surface)] shadow-lg"
                        />
                    ) : (
                        <div className="w-32 h-32 rounded-full bg-[var(--surface-2)] text-[var(--action)] flex items-center justify-center text-4xl font-bold border-4 border-[var(--surface)] shadow-lg">
                            {author.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* User Info */}
                <div className="flex-1 text-center sm:text-left z-10">
                    <h1 className="text-3xl font-black text-[var(--foreground)] mb-2 truncate">{author.name}</h1>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
                        <span className="px-4 py-1.5 bg-[var(--surface-2)] text-[var(--foreground)] rounded-full text-[10px] font-black uppercase tracking-widest border border-[var(--border)] shadow-sm">
                            Author
                        </span>
                        <span className="px-4 py-1.5 bg-[var(--surface-2)] text-[var(--text-muted)] rounded-full text-[10px] font-black tracking-widest border border-[var(--border)] shadow-sm uppercase">
                            Joined {joinedDate}
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. Novels Section */}
            <div className="mb-12">
                <div className="flex justify-between items-end mb-8 border-b border-[var(--border)] pb-4">
                    <h2 className="text-2xl font-black text-[var(--foreground)]">
                        Published Novels <span className="text-[var(--text-muted)] font-medium text-lg ml-2">({authorNovels.length})</span>
                    </h2>
                </div>

                {authorNovels.length === 0 ? (
                    <div className="bg-[var(--surface-2)] rounded-[2.5rem] p-16 text-center border border-dashed border-[var(--border)]">
                        <div className="text-6xl mb-6">📚</div>
                        <h3 className="text-2xl font-black text-[var(--foreground)] mb-3 tracking-tight">No novels yet</h3>
                        <p className="text-[var(--text-muted)] font-medium leading-relaxed">This author hasn't published any novels yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 gap-y-10">
                        {authorNovels.map((novel) => (
                            <div key={novel.id} className="group flex flex-col">
                                <Link href={`/novel/${novel.slug}`} className="block relative aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-lg mb-4 bg-[var(--surface-2)] border border-[var(--border)]">
                                    {novel.coverUrl ? (
                                        <img
                                            src={novel.coverUrl}
                                            alt={novel.title}
                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center w-full h-full text-[var(--text-muted)] bg-[var(--surface-3)]">
                                            <span className="text-4xl mb-2">📚</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest">No Cover</span>
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 flex gap-1">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-md backdrop-blur-md ${novel.status === 'ongoing' ? 'bg-emerald-500/90' : 'bg-[var(--action)]/90'}`}>
                                            {novel.status || 'Ongoing'}
                                        </span>
                                    </div>
                                </Link>

                                <h3 className="font-bold text-[var(--foreground)] leading-tight mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-[var(--action)] transition-colors">
                                    <Link href={`/novel/${novel.slug}`}>
                                        {novel.title}
                                    </Link>
                                </h3>

                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]">
                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {(novel.views || 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
