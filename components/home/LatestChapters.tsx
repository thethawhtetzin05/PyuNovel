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
                        className="group flex gap-3.5 p-3 rounded-[1.25rem] bg-card border border-border/20 hover:border-primary/20 hover:shadow-md transition-all duration-300"
                    >
                        {/* Cover */}
                        <div className="relative w-[60px] h-[80px] sm:w-[70px] sm:h-[96px] shrink-0 rounded-xl overflow-hidden bg-muted shadow-sm border border-border/20">
                            {chapter.novelCoverUrl ? (
                                <Image
                                    src={chapter.novelCoverUrl}
                                    alt={chapter.novelTitle}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    sizes="70px"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl">📚</div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex flex-col flex-1 min-w-0 justify-center py-0.5">
                            <h3 className="text-foreground font-bold text-[13px] sm:text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors duration-200">
                                {chapter.novelTitle}
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
                                <span className="text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/10 shrink-0">
                                    Ch {chapter.sortIndex}
                                </span>
                                <span className="text-xs sm:text-[13px] text-muted-foreground truncate font-medium group-hover:text-foreground transition-colors duration-200">
                                    {chapter.title}
                                </span>
                            </div>
                            <div className="mt-auto pt-2 flex items-center justify-between">
                                <span className="text-[10px] sm:text-[11px] text-muted-foreground/70 truncate font-medium group-hover:text-muted-foreground transition-colors duration-200">
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
