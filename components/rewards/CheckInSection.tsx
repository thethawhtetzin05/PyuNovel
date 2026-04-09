"use client";

import { hasCheckedInToday } from "@/lib/time";
import { useState } from "react";
import { calculateLevel, expForNextLevel } from "@/lib/leveling";

interface CheckInButtonProps {
    initialExp: number;
    initialLevel: number;
    initialStreak: number;
    lastCheckIn: Date | null;
}

function getTodayGain(streak: number, isCheckedIn: boolean): number {
    if (!isCheckedIn) return 0;
    let maxBonus: number;
    if (streak >= 365) maxBonus = 90;
    else if (streak >= 90) maxBonus = 50;
    else if (streak >= 30) maxBonus = 30;
    else maxBonus = 20;

    const streakBonus = Math.min(Math.max(0, streak - 1) * 2, maxBonus);
    return 10 + streakBonus;
}

export default function CheckInSection({ initialExp, initialLevel, initialStreak, lastCheckIn }: CheckInButtonProps) {
    const [exp, setExp] = useState(initialExp ?? 0);
    const [level, setLevel] = useState(initialLevel ?? 0);
    const [streak, setStreak] = useState(initialStreak ?? 0);
    const [checkedIn, setCheckedIn] = useState(hasCheckedInToday(lastCheckIn));
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ expGained: number; leveledUp: boolean; newLevel: number; streak: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const safeExp = isNaN(exp) ? 0 : exp;
    const safeLevel = isNaN(level) ? 0 : level;
    const nextLevelExp = expForNextLevel(safeLevel);            // e.g. Level 0 → needs 100 EXP
    const currentLevelExp = safeLevel * safeLevel * 100;       // EXP at start of current level
    const expInCurrentLevel = safeExp - currentLevelExp;
    const expNeededForNextLevel = nextLevelExp - currentLevelExp;
    const progress = expNeededForNextLevel > 0 ? Math.min((expInCurrentLevel / expNeededForNextLevel) * 100, 100) : 0;

    async function handleCheckIn() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/checkin", { method: "POST" });
            const result = await res.json() as { success: boolean; error?: string; newExp?: number; newLevel?: number; streak?: number; expGained?: number; leveledUp?: boolean; nextLevelExp?: number };
            if (result.success) {
                setExp(result.newExp!);
                setLevel(result.newLevel!);
                setStreak(result.streak!);
                setCheckedIn(true);
                setToast({ expGained: result.expGained!, leveledUp: result.leveledUp!, newLevel: result.newLevel!, streak: result.streak! });
                setTimeout(() => setToast(null), 4000);
            } else {
                console.error("[CheckIn] Failed:", result.error);
                setError(result.error ?? "Check-in failed. Please try again.");
                setTimeout(() => setError(null), 4000);
            }
        } catch (e) {
            console.error("[CheckIn] Exception:", e);
            const errMsg = e instanceof Error ? e.message : String(e);
            setError("Error: " + errMsg);
            setTimeout(() => setError(null), 8000);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-[var(--surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border)] shadow-lg mb-8">
            {/* Error Toast */}
            {error && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded-2xl px-6 py-4 shadow-2xl text-center min-w-[240px]">
                        <div className="text-3xl mb-1">❌</div>
                        <p className="font-black text-red-500 text-base">{error}</p>
                    </div>
                </div>
            )}

            {/* Success Toast / Notification */}
            {toast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 border border-[var(--border)] rounded-2xl px-6 py-4 shadow-2xl text-center min-w-[240px]">
                        <div className="text-3xl mb-1">{toast.leveledUp ? "🎉" : "✨"}</div>
                        <p className="font-black text-[var(--foreground)] text-lg">
                            {toast.leveledUp ? `Level Up! → Level ${toast.newLevel}` : `+${toast.expGained} EXP`}
                        </p>
                        <p className="text-[var(--text-muted)] text-sm mt-1">Day {toast.streak} Streak 🔥</p>
                    </div>
                </div>
            )}

            {/* Header Row */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                    <h3 className="text-lg font-black text-[var(--foreground)] flex items-center gap-2">
                        🧬 Level {safeLevel}
                        <span className="text-xs font-bold px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                            +{getTodayGain(streak, checkedIn)} EXP
                        </span>
                    </h3>
                    <p className="text-[var(--text-muted)] text-sm mt-0.5">
                        {streak > 0 ? `🔥 ${streak} day streak` : "Start your streak today!"}
                    </p>
                </div>

                {/* Check-in Button */}
                <button
                    onClick={handleCheckIn}
                    disabled={checkedIn || loading}
                    className={`px-5 py-2.5 rounded-full text-sm font-black transition-all active:scale-95 shadow-md ${checkedIn
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-300 dark:shadow-blue-900"
                        }`}
                >
                    {loading ? "..." : checkedIn ? "✅ Claimed" : "🎁 Daily Check-in"}
                </button>
            </div>

            {/* EXP Progress Bar */}
            <div>
                <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1.5 font-semibold">
                    <span>Level {safeLevel}</span>
                    <span>{expInCurrentLevel} / {expNeededForNextLevel} EXP</span>
                    <span>Level {safeLevel + 1}</span>
                </div>
                <div className="w-full h-3 bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
