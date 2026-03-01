'use client';

import { Users, Activity, CalendarDays, CalendarHeart, Clock } from 'lucide-react';
import type { UserStats } from '@/lib/resources/users/queries';

interface UserStatsDashboardProps {
    stats: UserStats;
}

export default function UserStatsDashboard({ stats }: UserStatsDashboardProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight">User Statistics</h1>
                <p className="text-[var(--text-muted)] mt-2 font-medium">Analytics overview of active readers and authors.</p>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Total Users */}
                <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shrink-0">
                        <Users size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Registered</p>
                        <h2 className="text-3xl font-black text-[var(--foreground)] mt-1">{stats.totalUsers.toLocaleString()}</h2>
                    </div>
                </div>

                {/* DAU */}
                <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
                        <Activity size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">DAU (24H)</p>
                        <h2 className="text-3xl font-black text-[var(--foreground)] mt-1">{stats.dau.toLocaleString()}</h2>
                    </div>
                </div>

                {/* WAU */}
                <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-fuchsia-100 text-fuchsia-600 rounded-xl shrink-0">
                        <CalendarDays size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">WAU (7 Days)</p>
                        <h2 className="text-3xl font-black text-[var(--foreground)] mt-1">{stats.wau.toLocaleString()}</h2>
                    </div>
                </div>

                {/* MAU */}
                <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-xl shrink-0">
                        <CalendarHeart size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">MAU (30 Days)</p>
                        <h2 className="text-3xl font-black text-[var(--foreground)] mt-1">{stats.mau.toLocaleString()}</h2>
                    </div>
                </div>
            </div>

            {/* Peak Hours Section */}
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[var(--border)] flex items-center gap-3">
                    <Clock size={20} className="text-[var(--action)]" />
                    <h2 className="text-xl font-bold text-[var(--foreground)]">Peak Active Hours</h2>
                </div>

                {stats.peakHours.length > 0 ? (
                    <div className="p-6 space-y-4">
                        {stats.peakHours.map((peak, index) => {
                            // Calculate a simple percentage width for the progress bar
                            const maxCount = Math.max(...stats.peakHours.map(p => p.count));
                            const percentage = maxCount > 0 ? (peak.count / maxCount) * 100 : 0;

                            return (
                                <div key={peak.hour} className="flex items-center gap-4">
                                    <div className="w-16 shrink-0 text-sm font-bold text-[var(--text-muted)]">
                                        {peak.hour}
                                    </div>
                                    <div className="flex-1 h-3 bg-[var(--surface-2)] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[var(--action)] rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <div className="w-20 text-right text-sm font-black text-[var(--foreground)]">
                                        {peak.count}
                                        <span className="text-[var(--text-muted)] font-medium text-xs ml-1">sessions</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-12 text-center text-[var(--text-muted)] flex flex-col items-center">
                        <Clock size={32} className="opacity-50 mb-3" />
                        <p className="font-medium text-lg">No active session data available</p>
                        <p className="text-sm opacity-70 mt-1">Check back later when users start logging in.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
