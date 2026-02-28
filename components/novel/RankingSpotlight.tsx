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
    novels: Novel[];
}

export default function RankingSpotlight({ novels }: Props) {
    if (novels.length === 0) return null;

    // Reorder to 2, 1, 3 for visual hierarchy (center is rank 1)
    const spotlight = [
        novels[1] || null, // Rank 2 (Left)
        novels[0],         // Rank 1 (Center)
        novels[2] || null, // Rank 3 (Right)
    ].filter(Boolean) as Novel[];

    const getRankStyles = (rank: number) => {
        switch (rank) {
            case 1: return "ring-4 ring-amber-400/30 border-amber-400 scale-110 z-20";
            case 2: return "ring-4 ring-slate-400/30 border-slate-400 scale-100 z-10";
            case 3: return "ring-4 ring-orange-400/30 border-orange-400 scale-95 z-10";
            default: return "";
        }
    };

    const getBadgeColors = (rank: number) => {
        switch (rank) {
            case 1: return "bg-amber-400 text-amber-950 shadow-[0_0_15px_rgba(251,191,36,0.5)]";
            case 2: return "bg-slate-400 text-slate-950";
            case 3: return "bg-orange-500 text-orange-950";
            default: return "bg-[var(--surface-3)] text-[var(--foreground)]";
        }
    };

    return (
        <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-10 md:gap-4 lg:gap-8 py-12 px-4">
            {spotlight.map((novel) => {
                const actualRank = novels.indexOf(novel) + 1;
                const isFirst = actualRank === 1;

                return (
                    <Link
                        key={novel.slug}
                        href={`/novel/${novel.slug}`}
                        className={`group flex flex-col items-center transition-all duration-500 ${isFirst ? 'order-1 md:order-2 md:mb-8' : actualRank === 2 ? 'order-2 md:order-1' : 'order-3'}`}
                    >
                        <div className={`relative w-[140px] md:w-[160px] lg:w-[200px] aspect-[2/3] rounded-2xl overflow-hidden bg-[var(--surface-2)] border-2 transition-transform group-hover:-translate-y-2 ${getRankStyles(actualRank)}`}>
                            {novel.coverUrl ? (
                                <Image
                                    src={novel.coverUrl}
                                    alt={novel.title}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 140px, 200px"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl">📚</div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* Rank Badge */}
                            <div className={`absolute -top-3 -left-3 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-black text-xl md:text-2xl rotate-[-12deg] border-2 border-white/20 ${getBadgeColors(actualRank)}`}>
                                {actualRank}
                            </div>
                        </div>

                        <div className="mt-6 text-center max-w-[160px] md:max-w-[200px]">
                            <h3 className="font-bold text-[var(--foreground)] text-sm md:text-base line-clamp-2 group-hover:text-[var(--action)] transition-colors leading-tight">
                                {novel.title}
                            </h3>
                            <p className="text-xs text-[var(--text-muted)] mt-1 font-medium truncate italic">{novel.author}</p>
                            {isFirst && (
                                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--action)]/10 text-[var(--action)] text-[10px] uppercase font-black tracking-wider border border-[var(--action)]/20">
                                    <span className="animate-pulse">🔥</span> Hot Ranking
                                </div>
                            )}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
