"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useTranslations } from 'next-intl';

export type LatestChapter = {
    id: number;
    title: string;
    sortIndex: number;
    createdAt: Date | null;
    novelSlug: string;
    novelTitle: string;
    novelCoverUrl: string | null;
    novelAuthor: string;
    novelStatus: string | null;
};

type Props = {
    chapters: LatestChapter[];
};

export default function LatestChapters({ chapters }: Props) {
    const t = useTranslations('Home');

    if (!chapters || chapters.length === 0) return null;

    return (
        <section>
            <div className="flex items-center justify-between mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] tracking-tight">
                    {t('latestChapters')}
                </h2>
            </div>

            <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-4">
                {chapters.map((chapter) => (
                    <Link
                        key={chapter.id}
                        href={`/novel/${chapter.novelSlug}/${chapter.sortIndex}`}
                        className="group flex gap-3.5 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--action)]/50 hover:shadow-md transition-all"
                    >
                        {/* Cover */}
                        <div className="relative w-[60px] h-[80px] sm:w-[70px] sm:h-[96px] shrink-0 rounded-lg overflow-hidden bg-[var(--surface-2)] shadow-sm">
                            {chapter.novelCoverUrl ? (
                                <Image
                                    src={chapter.novelCoverUrl}
                                    alt={chapter.novelTitle}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    sizes="70px"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl">📚</div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex flex-col flex-1 min-w-0 justify-center py-0.5">
                            <h3 className="text-[var(--foreground)] font-bold text-[13px] sm:text-sm leading-snug line-clamp-1 group-hover:text-[var(--action)] transition-colors">
                                {chapter.novelTitle}
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
                                <span className="text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)] shrink-0">
                                    Ch {chapter.sortIndex}
                                </span>
                                <span className="text-xs sm:text-[13px] text-[var(--text-muted)] truncate font-medium">
                                    {chapter.title}
                                </span>
                            </div>
                            <div className="mt-auto pt-2 flex items-center justify-between">
                                <span className="text-[10px] sm:text-[11px] text-[var(--text-muted)] truncate">
                                    {chapter.novelAuthor}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
