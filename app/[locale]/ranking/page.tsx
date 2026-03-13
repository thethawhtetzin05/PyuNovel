import React from 'react';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { drizzle } from 'drizzle-orm/d1';
import { getTopNovelsByViews, getLatestNovels, getRecentlyUpdatedNovels, getTopNovelsByCollectors } from '@/lib/resources/novels/queries';
import RankingSpotlight from '@/components/novel/RankingSpotlight';
import RankingRow from '@/components/novel/RankingRow';
import RankingHeader from '@/components/novel/RankingHeader';

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
        { id: 'popular', label: 'Popular', icon: '🔥' },
        { id: 'collector', label: 'Collection', icon: '🔖' },
        { id: 'new', label: 'New Release', icon: '✨' },
        { id: 'updated', label: 'Recently Updated', icon: '🔄' },
    ];

    return (
        <div className="min-h-screen bg-[var(--background)] pb-32">
            <main className="max-w-5xl mx-auto md:px-4">
                {/* Compact Header with Dropdown */}
                <RankingHeader currentType={type} tabs={tabs} />

                {rankedNovels.length === 0 ? (
                    <div className="py-20 text-center bg-[var(--surface)] rounded-3xl border border-dashed border-[var(--border)]">
                        <p className="text-[var(--text-muted)] font-medium">No novels found in this category.</p>
                    </div>
                ) : (
                    <>
                        {/* Section Header */}
                        <div className="flex flex-col mb-8 px-4 md:px-0">
                            <h2 className="text-2xl font-black text-[var(--foreground)] flex items-center gap-3">
                                <span>{tabs.find(t => t.id === type)?.icon}</span>
                                {title}
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
