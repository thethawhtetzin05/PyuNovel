import { Link } from '@/i18n/routing';
import Image from "next/image";
import { novels } from "@/db/schema";

interface Novel {
    id: number;
    title: string;
    slug: string;
    author: string;
    coverUrl: string | null;
    status?: "completed" | "ongoing" | "hiatus" | null;
    views?: number | null;
    tags?: string | null;
}

interface Props {
    novel: Novel;
    rank: number;
}

export default function RankingRow({ novel, rank }: Props) {
    return (
        <Link
            href={`/novel/${novel.slug}`}
            className="group flex items-center gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--action)]/30 hover:bg-[var(--surface-2)] transition-all duration-300 shadow-sm hover:shadow-md"
        >
            <div className="w-12 h-12 flex items-center justify-center font-black text-2xl text-[var(--text-muted)] italic group-hover:text-[var(--action)] transition-colors shrink-0">
                {rank.toString().padStart(2, '0')}
            </div>

            <div className="relative w-16 md:w-20 aspect-[2/3] rounded-lg overflow-hidden bg-[var(--surface-2)] shrink-0 shadow-sm">
                {novel.coverUrl ? (
                    <Image
                        src={novel.coverUrl}
                        alt={novel.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="80px"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">📚</div>
                )}
            </div>

            <div className="flex-1 min-w-0 py-1">
                <h3 className="font-bold text-[var(--foreground)] text-sm md:text-base lg:text-lg truncate group-hover:text-[var(--action)] transition-colors">
                    {novel.title}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 truncate">By <span className="font-medium text-[var(--foreground)]">{novel.author}</span></p>

                <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs">👁️</span>
                        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{novel.views?.toLocaleString()} Views</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs">🏷️</span>
                        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider line-clamp-1">
                            {novel.tags ? novel.tags.split(',')[0] : 'Fiction'}
                        </span>
                    </div>
                    {novel.status && (
                        <div className="hidden sm:inline-flex items-center gap-1 bg-[var(--surface-3)] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                            {novel.status}
                        </div>
                    )}
                </div>
            </div>

            <div className="hidden md:flex flex-col items-end shrink-0 ml-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--action)] group-hover:translate-x-1 transition-all">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </div>
        </Link>
    );
}
