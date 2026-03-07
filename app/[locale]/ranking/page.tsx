import React from 'react';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { drizzle } from 'drizzle-orm/d1';
import { getTopNovelsByViews, getLatestNovels, getRecentlyUpdatedNovels, getTopNovelsByCollectors } from '@/lib/resources/novels/queries';
import RankingSpotlight from '@/components/novel/RankingSpotlight';
import RankingRow from '@/components/novel/RankingRow';
import { Link } from '@/i18n/routing';

export const runtime = 'edge';

export default async function RankingPage({
    searchParams
}: {
    searchParams: Promise<{ type?: string }>
}) {
    const params = await searchParams;
    const type = params.type || 'popular';

    const { env } = getRequestContext();
    const db = drizzle(env.DB);

    let rankedNovels: any[] = [];
    let title = "";
    let subtitle = "";

    switch (type) {
        case 'new':
            rankedNovels = await getLatestNovels(db, 20);
            title = "New Releases";
            subtitle = "Fresh stories recently added to our library.";
            break;
        case 'updated':
            rankedNovels = await getRecentlyUpdatedNovels(db, 20);
            title = "Recently Updated";
            subtitle = "Follow the latest chapters from ongoing series.";
            break;
        case 'collector':
            rankedNovels = await getTopNovelsByCollectors(db, 20);
            title = "Most Collected";
            subtitle = "Stories that readers love enough to save to their library.";
            break;
        default:
            rankedNovels = await getTopNovelsByViews(db, 20);
            title = "Most Popular";
            subtitle = "The highest rated and most viewed stories of all time.";
    }

    const spotlight = rankedNovels.slice(0, 3);
    const list = rankedNovels.slice(3);

    const tabs = [
        { id: 'popular', label: 'Most Popular', icon: '🔥' },
        { id: 'collector', label: 'Most Collected', icon: '🔖' },
        { id: 'new', label: 'New Releases', icon: '✨' },
        { id: 'updated', label: 'Recently Updated', icon: '🔄' },
    ];

    return (
        <div className="min-h-screen bg-[var(--background)] pb-32">
            {/* Header Section */}
            <div className="relative pt-20 pb-16 px-4 overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-[var(--action)]/5 blur-[120px] rounded-full -z-10" />

                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-black text-[var(--foreground)] tracking-tight mb-4" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                        Pyu <span className="gradient-text">Ranking</span>
                    </h1>
                    <p className="text-[var(--text-muted)] text-base md:text-xl font-medium max-w-2xl mx-auto">
                        Explore the best novels curated just for you. Real-time updates based on community activity.
                    </p>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-4">
                {/* Category Navigation */}
                <div className="flex flex-wrap justify-center gap-2 mb-12">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.id}
                            href={`/ranking?type=${tab.id}`}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm md:text-base border transition-all duration-300 
                                ${type === tab.id
                                    ? "bg-[var(--action)] border-[var(--action)] text-white shadow-lg shadow-[var(--action)]/20"
                                    : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--action)]/50 hover:text-[var(--foreground)]"
                                }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </Link>
                    ))}
                </div>

                {rankedNovels.length === 0 ? (
                    <div className="py-20 text-center bg-[var(--surface)] rounded-3xl border border-dashed border-[var(--border)]">
                        <p className="text-[var(--text-muted)] font-medium">No novels found in this category.</p>
                    </div>
                ) : (
                    <>
                        {/* Section Header */}
                        <div className="flex flex-col mb-8">
                            <h2 className="text-2xl font-black text-[var(--foreground)] flex items-center gap-3">
                                {tabs.find(t => t.id === type)?.icon} {title}
                            </h2>
                            <p className="text-[var(--text-muted)] text-sm font-medium mt-1">{subtitle}</p>
                        </div>

                        {/* Top 3 Spotlight */}
                        <RankingSpotlight novels={spotlight} rankingType={type} />

                        {/* Rank List (4-20) */}
                        <div className="mt-12 space-y-4">
                            {list.map((novel, index) => (
                                <RankingRow
                                    key={novel.slug}
                                    novel={novel}
                                    rank={index + 4}
                                    rankingType={type}
                                />
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
