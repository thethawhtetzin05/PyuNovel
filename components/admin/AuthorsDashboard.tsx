'use client';

import React, { useState, useMemo } from 'react';
import { 
    Users, 
    BookOpen, 
    Eye, 
    Send, 
    Search, 
    ExternalLink, 
    X, 
    Coins, 
    Sparkles, 
    Calendar,
    ArrowUpDown,
    BookMarked
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import type { AuthorListItem, AuthorKPIMetrics } from '@/lib/resources/users/queries';

interface AuthorsDashboardProps {
    authors: AuthorListItem[];
    metrics: AuthorKPIMetrics;
}

type FilterType = 'all' | 'active' | 'inactive' | 'telegram';
type SortType = 'views' | 'novels' | 'coins' | 'newest';

export default function AuthorsDashboard({ authors, metrics }: AuthorsDashboardProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [sortBy, setSortBy] = useState<SortType>('views');
    const [selectedAuthor, setSelectedAuthor] = useState<AuthorListItem | null>(null);

    // Format number helper (e.g. 1.2k, 4.5M)
    const formatNumber = (num: number) => {
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
        if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
        return num.toLocaleString();
    };

    // Filter & Sort authors
    const filteredAuthors = useMemo(() => {
        return authors
            .filter((author) => {
                // Search query match
                const query = searchQuery.toLowerCase().trim();
                const matchesSearch = 
                    !query ||
                    author.name.toLowerCase().includes(query) ||
                    author.email.toLowerCase().includes(query) ||
                    (author.telegramUsername && author.telegramUsername.toLowerCase().includes(query)) ||
                    (author.telegramName && author.telegramName.toLowerCase().includes(query));

                if (!matchesSearch) return false;

                // Category filter
                if (activeFilter === 'active') return author.novelsCount > 0;
                if (activeFilter === 'inactive') return author.novelsCount === 0;
                if (activeFilter === 'telegram') return Boolean(author.telegramId || author.telegramUsername);
                return true;
            })
            .sort((a, b) => {
                if (sortBy === 'views') return b.totalViews - a.totalViews;
                if (sortBy === 'novels') return b.novelsCount - a.novelsCount;
                if (sortBy === 'coins') return b.coins - a.coins;
                if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                return 0;
            });
    }, [authors, searchQuery, activeFilter, sortBy]);

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* ─── Header ────────────────────────────────────────── */}
            <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--action)] mb-1">
                    <Sparkles size={14} />
                    <span>Management & Analytics</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tight">
                    Authors Directory
                </h1>
                <p className="text-[var(--text-muted)] mt-1.5 font-medium text-sm md:text-base">
                    Comprehensive overview of all registered writers, published novels, audience views, and integrations.
                </p>
            </div>

            {/* ─── KPI Metrics Cards ──────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                {/* Total Authors */}
                <div className="bg-[var(--surface)] p-5 md:p-6 rounded-2xl border border-[var(--border)] shadow-sm hover:border-[var(--action)]/40 transition-all flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Authors</p>
                        <h2 className="text-3xl font-black text-[var(--foreground)] mt-1.5">
                            {metrics.totalAuthors.toLocaleString()}
                        </h2>
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--text-muted)] font-semibold">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                            <span>{metrics.activeAuthors} with published stories</span>
                        </div>
                    </div>
                    <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
                        <Users size={24} strokeWidth={2.5} />
                    </div>
                </div>

                {/* Total Novels Authored */}
                <div className="bg-[var(--surface)] p-5 md:p-6 rounded-2xl border border-[var(--border)] shadow-sm hover:border-[var(--action)]/40 transition-all flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Novels</p>
                        <h2 className="text-3xl font-black text-[var(--foreground)] mt-1.5">
                            {metrics.totalNovels.toLocaleString()}
                        </h2>
                        <p className="text-xs text-[var(--text-muted)] mt-2 font-semibold">
                            Published in PyuNovel catalog
                        </p>
                    </div>
                    <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                        <BookOpen size={24} strokeWidth={2.5} />
                    </div>
                </div>

                {/* Total Cumulative Views */}
                <div className="bg-[var(--surface)] p-5 md:p-6 rounded-2xl border border-[var(--border)] shadow-sm hover:border-[var(--action)]/40 transition-all flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Novel Views</p>
                        <h2 className="text-3xl font-black text-[var(--foreground)] mt-1.5">
                            {formatNumber(metrics.totalViews)}
                        </h2>
                        <p className="text-xs text-[var(--text-muted)] mt-2 font-semibold">
                            Cumulative reader engagement
                        </p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <Eye size={24} strokeWidth={2.5} />
                    </div>
                </div>

                {/* Telegram Linked Authors */}
                <div className="bg-[var(--surface)] p-5 md:p-6 rounded-2xl border border-[var(--border)] shadow-sm hover:border-[var(--action)]/40 transition-all flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Telegram Linked</p>
                        <h2 className="text-3xl font-black text-[var(--foreground)] mt-1.5">
                            {metrics.telegramLinkedCount.toLocaleString()}
                        </h2>
                        <p className="text-xs text-sky-600 dark:text-sky-400 mt-2 font-semibold flex items-center gap-1">
                            <span>Ready for bot publishing</span>
                        </p>
                    </div>
                    <div className="p-3 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-xl">
                        <Send size={24} strokeWidth={2.5} />
                    </div>
                </div>
            </div>

            {/* ─── Search, Filter & Sort Controls ──────────────────── */}
            <div className="bg-[var(--surface)] p-4 md:p-5 rounded-2xl border border-[var(--border)] shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by author name, email, or @telegram..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--action)] transition"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-[var(--border)] hover:bg-[var(--text-muted)] hover:text-white px-1.5 py-0.5 rounded-md transition"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2 self-end md:self-auto">
                        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                            <ArrowUpDown size={13} />
                            <span>Sort:</span>
                        </span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortType)}
                            className="bg-[var(--surface-2)] border border-[var(--border)] text-xs md:text-sm font-semibold rounded-xl px-3 py-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--action)] cursor-pointer"
                        >
                            <option value="views">Most Views</option>
                            <option value="novels">Most Novels</option>
                            <option value="coins">Highest Coins</option>
                            <option value="newest">Newest Joined</option>
                        </select>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs font-semibold scrollbar-none border-t border-[var(--border)]/60">
                    <button
                        onClick={() => setActiveFilter('all')}
                        className={`px-3.5 py-1.5 rounded-lg transition-all ${
                            activeFilter === 'all'
                                ? 'bg-[var(--action)] text-white shadow-sm'
                                : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
                        }`}
                    >
                        All Authors ({authors.length})
                    </button>
                    <button
                        onClick={() => setActiveFilter('active')}
                        className={`px-3.5 py-1.5 rounded-lg transition-all ${
                            activeFilter === 'active'
                                ? 'bg-[var(--action)] text-white shadow-sm'
                                : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
                        }`}
                    >
                        Published ({metrics.activeAuthors})
                    </button>
                    <button
                        onClick={() => setActiveFilter('inactive')}
                        className={`px-3.5 py-1.5 rounded-lg transition-all ${
                            activeFilter === 'inactive'
                                ? 'bg-[var(--action)] text-white shadow-sm'
                                : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
                        }`}
                    >
                        Drafting / 0 Novels ({authors.length - metrics.activeAuthors})
                    </button>
                    <button
                        onClick={() => setActiveFilter('telegram')}
                        className={`px-3.5 py-1.5 rounded-lg transition-all ${
                            activeFilter === 'telegram'
                                ? 'bg-[var(--action)] text-white shadow-sm'
                                : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
                        }`}
                    >
                        Telegram Linked ({metrics.telegramLinkedCount})
                    </button>
                </div>
            </div>

            {/* ─── Authors Table ───────────────────────────────────── */}
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/60 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                <th className="py-3.5 px-4 md:px-6">Author</th>
                                <th className="py-3.5 px-4">Telegram</th>
                                <th className="py-3.5 px-4 text-center">Novels</th>
                                <th className="py-3.5 px-4 text-center">Total Views</th>
                                <th className="py-3.5 px-4 text-center">Coins</th>
                                <th className="py-3.5 px-4">Joined</th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)] text-sm">
                            {filteredAuthors.length > 0 ? (
                                filteredAuthors.map((author) => (
                                    <tr 
                                        key={author.id} 
                                        className="hover:bg-[var(--surface-2)]/40 transition-colors group"
                                    >
                                        {/* Author Identity */}
                                        <td className="py-4 px-4 md:px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                                    {author.image ? (
                                                        <img
                                                            src={author.image}
                                                            alt={author.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        author.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-[var(--foreground)] truncate group-hover:text-[var(--action)] transition">
                                                            {author.name}
                                                        </span>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--action)]/10 text-[var(--action)] uppercase">
                                                            {author.role}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-[var(--text-muted)] truncate font-mono">
                                                        {author.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Telegram Account */}
                                        <td className="py-4 px-4">
                                            {author.telegramUsername || author.telegramId ? (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-semibold">
                                                    <Send size={12} />
                                                    <span>{author.telegramUsername ? `@${author.telegramUsername}` : `ID: ${author.telegramId}`}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-[var(--text-muted)] opacity-60">Not Linked</span>
                                            )}
                                        </td>

                                        {/* Novels Count */}
                                        <td className="py-4 px-4 text-center">
                                            <button
                                                onClick={() => setSelectedAuthor(author)}
                                                disabled={author.novelsCount === 0}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition ${
                                                    author.novelsCount > 0
                                                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 cursor-pointer'
                                                        : 'text-[var(--text-muted)] opacity-50 cursor-default'
                                                }`}
                                            >
                                                <BookOpen size={13} />
                                                <span>{author.novelsCount}</span>
                                            </button>
                                        </td>

                                        {/* Total Views */}
                                        <td className="py-4 px-4 text-center font-bold text-[var(--foreground)]">
                                            <span className="inline-flex items-center gap-1">
                                                <Eye size={14} className="text-[var(--text-muted)]" />
                                                <span>{formatNumber(author.totalViews)}</span>
                                            </span>
                                        </td>

                                        {/* Coins */}
                                        <td className="py-4 px-4 text-center">
                                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-xs bg-amber-500/10 px-2.5 py-1 rounded-lg">
                                                <Coins size={12} />
                                                <span>{author.coins.toLocaleString()}</span>
                                            </span>
                                        </td>

                                        {/* Joined Date */}
                                        <td className="py-4 px-4 text-xs text-[var(--text-muted)] font-medium whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={13} />
                                                <span>{new Date(author.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-4 px-4 md:px-6 text-right">
                                            <div className="inline-flex items-center gap-2">
                                                {author.novelsCount > 0 && (
                                                    <button
                                                        onClick={() => setSelectedAuthor(author)}
                                                        className="p-1.5 rounded-lg bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition"
                                                        title="View Novels Catalog"
                                                    >
                                                        <BookMarked size={16} />
                                                    </button>
                                                )}
                                                <Link
                                                    href={`/author/${author.id}`}
                                                    target="_blank"
                                                    className="p-1.5 rounded-lg bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--action)] hover:bg-[var(--action)]/10 transition inline-flex items-center"
                                                    title="View Public Profile"
                                                >
                                                    <ExternalLink size={16} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-[var(--text-muted)]">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <Users size={36} className="opacity-30" />
                                            <p className="font-semibold text-base">No authors found</p>
                                            <p className="text-xs opacity-75">
                                                Try adjusting your search query or switching filter tabs.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Count */}
                <div className="p-4 bg-[var(--surface-2)]/40 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
                    <span>
                        Showing <strong>{filteredAuthors.length}</strong> of <strong>{authors.length}</strong> total authors
                    </span>
                </div>
            </div>

            {/* ─── Author Novels Quick-View Modal ───────────────────── */}
            {selectedAuthor && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedAuthor(null)}
                >
                    <div 
                        className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-2)]/50">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                                    {selectedAuthor.image ? (
                                        <img
                                            src={selectedAuthor.image}
                                            alt={selectedAuthor.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        selectedAuthor.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-black text-[var(--foreground)]">
                                            {selectedAuthor.name}&apos;s Novels
                                        </h3>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                                            {selectedAuthor.novelsCount} {selectedAuthor.novelsCount === 1 ? 'Novel' : 'Novels'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                                        {selectedAuthor.email}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedAuthor(null)}
                                className="p-2 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] rounded-xl transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body - Novel Cards */}
                        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
                            {selectedAuthor.novels.length > 0 ? (
                                selectedAuthor.novels.map((novel) => (
                                    <div
                                        key={novel.id}
                                        className="p-4 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)] hover:border-[var(--action)]/40 transition flex items-center gap-4 justify-between"
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className="w-12 h-16 rounded-lg bg-[var(--border)] overflow-hidden shrink-0 shadow-sm">
                                                {novel.coverUrl ? (
                                                    <img
                                                        src={novel.coverUrl}
                                                        alt={novel.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">
                                                        No Cover
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-sm text-[var(--foreground)] truncate">
                                                    {novel.title}
                                                </h4>
                                                <p className="text-xs text-[var(--text-muted)] truncate mt-0.5 font-mono">
                                                    /{novel.slug}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                                                        novel.status === 'completed'
                                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                    }`}>
                                                        {novel.status || 'ongoing'}
                                                    </span>
                                                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 font-semibold">
                                                        <Eye size={12} />
                                                        <span>{novel.views.toLocaleString()} views</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/novel/${novel.slug}`}
                                            target="_blank"
                                            className="px-3 py-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--action)] hover:text-white text-xs font-bold text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--action)] transition flex items-center gap-1.5 shrink-0 shadow-sm"
                                        >
                                            <span>View Novel</span>
                                            <ExternalLink size={13} />
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-[var(--text-muted)] text-sm">
                                    No published novels for this author yet.
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-[var(--surface-2)]/40 border-t border-[var(--border)] flex justify-end">
                            <button
                                onClick={() => setSelectedAuthor(null)}
                                className="px-5 py-2 rounded-xl bg-[var(--surface-2)] text-xs font-bold text-[var(--foreground)] hover:bg-[var(--border)] transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
