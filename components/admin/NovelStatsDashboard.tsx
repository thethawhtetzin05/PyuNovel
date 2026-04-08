'use client';

import { Book, Layers, BarChart3, TrendingUp, User } from 'lucide-react';
import type { NovelStats } from '@/lib/resources/novels/queries';
import { Link } from '@/i18n/routing';

interface NovelStatsDashboardProps {
    stats: NovelStats;
}

export default function NovelStatsDashboard({ stats }: NovelStatsDashboardProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tight">Novel Statistics</h1>
                <p className="text-[var(--text-muted)] mt-2 font-medium">Platform-wide content analytics and engagement metrics.</p>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Total Novels */}
                <div className="bg-[var(--surface)] p-6 rounded-3xl border border-[var(--border)] shadow-sm flex items-start gap-5 hover:shadow-md transition-shadow group">
                    <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
                        <Book size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Total Novels</p>
                        <h2 className="text-4xl font-black text-[var(--foreground)] mt-1">{stats.totalNovels.toLocaleString()}</h2>
                    </div>
                </div>

                {/* Total Chapters */}
                <div className="bg-[var(--surface)] p-6 rounded-3xl border border-[var(--border)] shadow-sm flex items-start gap-5 hover:shadow-md transition-shadow group">
                    <div className="p-4 bg-violet-100 dark:bg-violet-900/30 text-violet-600 rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
                        <Layers size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Total Chapters</p>
                        <h2 className="text-4xl font-black text-[var(--foreground)] mt-1">{stats.totalChapters.toLocaleString()}</h2>
                    </div>
                </div>

                {/* Total Views */}
                <div className="bg-[var(--surface)] p-6 rounded-3xl border border-[var(--border)] shadow-sm flex items-start gap-5 hover:shadow-md transition-shadow group">
                    <div className="p-4 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
                        <TrendingUp size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Total Views</p>
                        <h2 className="text-4xl font-black text-[var(--foreground)] mt-1">{stats.totalViews.toLocaleString()}</h2>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Status Breakdown */}
                <div className="bg-[var(--surface)] p-8 rounded-3xl border border-[var(--border)] shadow-sm">
                    <h2 className="text-xl font-bold text-[var(--foreground)] mb-8 flex items-center gap-3">
                        <BarChart3 size={22} className="text-[var(--action)]" />
                        Status Breakdown
                    </h2>
                    
                    <div className="space-y-6">
                        {stats.statusCounts.map((item) => {
                            const currentStatus = item.status || 'unknown';
                            const percentage = stats.totalNovels > 0 ? (item.count / stats.totalNovels) * 100 : 0;
                            const statusLabel = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);
                            
                            // Color mapping
                            const colors: any = {
                                ongoing: 'bg-blue-500',
                                completed: 'bg-emerald-500',
                                hiatus: 'bg-amber-500',
                                dropped: 'bg-red-500',
                            };
                            const barColor = colors[currentStatus.toLowerCase()] || 'bg-slate-500';

                            return (
                                <div key={currentStatus} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="font-bold text-[var(--foreground)]">{statusLabel}</span>
                                        <span className="text-[var(--text-muted)] font-bold text-sm">
                                            {item.count} <span className="font-medium">({percentage.toFixed(1)}%)</span>
                                        </span>
                                    </div>
                                    <div className="h-3 bg-[var(--surface-2)] rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full ${barColor} rounded-full transition-all duration-1000 ease-out`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {stats.statusCounts.length === 0 && (
                            <p className="text-center text-[var(--text-muted)] py-10 italic">No status data available.</p>
                        )}
                    </div>
                </div>

                {/* Top Viewed Novels */}
                <div className="bg-[var(--surface)] p-8 rounded-3xl border border-[var(--border)] shadow-sm">
                    <h2 className="text-xl font-bold text-[var(--foreground)] mb-8 flex items-center gap-3">
                        <TrendingUp size={22} className="text-orange-500" />
                        Top Viewed Novels
                    </h2>

                    <div className="space-y-4">
                        {stats.topNovels.map((novel, index) => (
                            <Link 
                                key={novel.id} 
                                href={`/novel/${novel.slug}`}
                                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[var(--surface-2)] transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center font-black text-lg text-[var(--text-muted)] group-hover:text-[var(--action)] transition-colors">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-[var(--foreground)] truncate group-hover:text-[var(--action)] transition-colors">
                                        {novel.title}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                            <User size={12} />
                                            {novel.author}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-[var(--foreground)]">{novel.views.toLocaleString()}</p>
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)]">Views</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
