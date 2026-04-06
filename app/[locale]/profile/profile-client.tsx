"use client";

import { useState, useTransition } from "react";
import { Link, useRouter, usePathname } from '@/i18n/routing';
import { useSearchParams } from "next/navigation";
import ProfileEditModal from "@/components/modals/ProfileEditModal";
import RewardHub from "@/components/reward/RewardHub";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Pencil, Gift, Sparkles, AlertCircle } from "lucide-react";
import { expForNextLevel } from "@/lib/leveling";

interface ProfileClientProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userNovels: any[];
}

function hasCheckedInToday(lastCheckIn: Date | string | null): boolean {
    if (!lastCheckIn) return false;
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    return new Date(lastCheckIn) >= todayUTC;
}

export default function ProfileClient({ user, userNovels }: ProfileClientProps) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [, startTransition] = useTransition();

    // Check-in State
    const [exp, setExp] = useState(user.exp ?? 0);
    const [level, setLevel] = useState(user.level ?? 0);
    const [streak, setStreak] = useState(user.checkInStreak ?? 0);
    const [checkedIn, setCheckedIn] = useState(hasCheckedInToday(user.lastCheckIn));
    const [checkInLoading, setCheckInLoading] = useState(false);
    const [toast, setToast] = useState<{ expGained: number; leveledUp: boolean; newLevel: number; streak: number } | null>(null);
    const [checkInError, setCheckInError] = useState<string | null>(null);

    const safeExp = isNaN(exp) ? 0 : exp;
    const safeLevel = isNaN(level) ? 0 : level;
    const nextLevelExp = expForNextLevel(safeLevel);
    const currentLevelExp = safeLevel * safeLevel * 100;
    const expInCurrentLevel = safeExp - currentLevelExp;
    const expNeededForNextLevel = nextLevelExp - currentLevelExp;
    const progress = expNeededForNextLevel > 0 ? Math.min((expInCurrentLevel / expNeededForNextLevel) * 100, 100) : 0;

    const handleCheckIn = async () => {
        setCheckInLoading(true);
        setCheckInError(null);
        try {
            const res = await fetch("/api/checkin", { method: "POST" });
            const result = await res.json() as { success: boolean; error?: string; newExp?: number; newLevel?: number; streak?: number; expGained?: number; leveledUp?: boolean; nextLevelExp?: number };
            if (result.success) {
                setExp(result.newExp!);
                setLevel(result.newLevel!);
                setStreak(result.streak!);
                setCheckedIn(true);
                setToast({
                    expGained: result.expGained!,
                    leveledUp: result.leveledUp!,
                    newLevel: result.newLevel!,
                    streak: result.streak!
                });
                setTimeout(() => setToast(null), 4000);
                router.refresh();
            } else {
                setCheckInError(result.error ?? "Failed to check in");
                setTimeout(() => setCheckInError(null), 4000);
            }
        } catch {
            setCheckInError("Network error occurred");
            setTimeout(() => setCheckInError(null), 4000);
        } finally {
            setCheckInLoading(false);
        }
    };

    const activeTab = searchParams.get("tab") || "novels";

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", value);
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        });
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 min-h-screen">

            {/* 1. Header & Profile Card */}
            <div className="bg-[var(--surface)] rounded-3xl p-8 sm:p-10 shadow-xl border border-[var(--border)] mb-12 relative overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-purple-500 opacity-5 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-blue-500 opacity-5 blur-3xl pointer-events-none" />

                {/* Toast & Error Overlays */}
                {checkInError && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="bg-red-500 text-white px-4 py-2 rounded-full text-xs font-black flex items-center gap-2 shadow-xl border border-red-400">
                            <AlertCircle className="w-3 h-3" />
                            {checkInError}
                        </div>
                    </div>
                )}
                {toast && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="bg-emerald-500 text-white px-6 py-2.5 rounded-full text-sm font-black flex items-center gap-2 shadow-xl border border-emerald-400">
                            {toast.leveledUp ? <Sparkles className="w-4 h-4 fill-white animate-bounce" /> : <Gift className="w-4 h-4" />}
                            {toast.leveledUp ? `Level Up! → ${toast.newLevel}` : `+${toast.expGained} EXP 🔥`}
                        </div>
                    </div>
                )}

                {/* Top Row: Avatar + Name + Controls */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 z-10 relative">
                    {/* Avatar */}
                    <div className="shrink-0 group cursor-pointer" onClick={() => setIsEditModalOpen(true)}>
                        <div className="relative">
                            {user.image ? (
                                <img src={user.image} alt={user.name} className="w-24 h-24 rounded-full object-cover border-2 border-[var(--border)] shadow-xl transition-all group-hover:scale-105 group-hover:shadow-2xl" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 text-[var(--action)] flex items-center justify-center text-3xl font-black border-2 border-[var(--border)] shadow-xl transition-all group-hover:scale-105 leading-none">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Pencil className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Name + Streak */}
                    <div className="flex-1 text-center sm:text-left">
                        <h1 className="text-3xl font-black text-[var(--foreground)] truncate">{user.name}</h1>
                        <p className={`text-sm font-bold mt-1 ${streak > 0 ? "text-orange-400 animate-pulse" : "text-[var(--text-muted)]"}`}>
                            {streak > 0 ? `🔥 ${streak} Day Streak` : "Start your streak today!"}
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 z-20">
                        <button
                            onClick={handleCheckIn}
                            disabled={checkedIn || checkInLoading}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 border ${checkedIn
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 cursor-not-allowed"
                                : "bg-[var(--action)] text-white border-[var(--action)]/30 hover:scale-105 hover:shadow-lg hover:shadow-[var(--action)]/30"
                                }`}
                        >
                            {checkInLoading ? "..." : checkedIn ? "✓ Claimed" : "🎁 Check-In"}
                        </button>
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="p-2.5 rounded-xl bg-[var(--surface-2)]/50 hover:bg-[var(--surface-3)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--action)] transition-all active:scale-90 group/edit"
                            title="Edit Profile"
                        >
                            <Pencil className="w-4 h-4 group-hover/edit:rotate-12 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* EXP Progress Bar */}
                <div className="mb-8 z-10 relative">
                    <div className="flex justify-between text-[10px] font-black text-[var(--text-muted)] mb-2 uppercase tracking-widest">
                        <span>Level {safeLevel}</span>
                        <span>{expInCurrentLevel} / {expNeededForNextLevel} EXP</span>
                        <span>Level {safeLevel + 1}</span>
                    </div>
                    <div className="w-full h-2 bg-[var(--surface-2)] rounded-full overflow-hidden border border-[var(--border)]/50">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Game Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 z-10 relative">
                    {/* Level */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/5 border border-purple-500/20 rounded-2xl p-4 flex flex-col items-center gap-1.5 hover:scale-[1.02] transition-transform group/stat">
                        <div className="text-2xl">⭐</div>
                        <div className="text-2xl font-black text-purple-400 group-hover/stat:scale-110 transition-transform">{safeLevel}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-purple-400/60">Level</div>
                    </div>
                    {/* Coins */}
                    <div className="bg-gradient-to-br from-[var(--action)]/10 to-yellow-500/5 border border-[var(--action)]/20 rounded-2xl p-4 flex flex-col items-center gap-1.5 hover:scale-[1.02] transition-transform group/stat">
                        <div className="text-2xl">🪙</div>
                        <div className="text-2xl font-black text-[var(--action)] group-hover/stat:scale-110 transition-transform">{user.coins || 0}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-[var(--action)]/60">Coins</div>
                    </div>
                    {/* Yield */}
                    <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center gap-1.5 hover:scale-[1.02] transition-transform group/stat">
                        <div className="text-2xl">🎫</div>
                        <div className="text-2xl font-black text-emerald-400 group-hover/stat:scale-110 transition-transform">{user.couponYield || 1}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-emerald-400/60">Daily Yield</div>
                    </div>
                    {/* Longevity */}
                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 rounded-2xl p-4 flex flex-col items-center gap-1.5 hover:scale-[1.02] transition-transform group/stat">
                        <div className="text-2xl">⏳</div>
                        <div className="text-2xl font-black text-blue-400 group-hover/stat:scale-110 transition-transform">{user.couponLongevity || 1}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-blue-400/60">Day Lifetime</div>
                    </div>
                </div>
            </div>

            {/* Daily Check-in section merged into header */}


            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="w-full justify-start bg-transparent border-b border-[var(--border)] rounded-none h-14 p-0 mb-8 gap-8">
                    <TabsTrigger
                        value="novels"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--action)] data-[state=active]:bg-transparent bg-transparent px-2 h-full text-base font-bold transition-all gap-2"
                    >
                        My Novels
                        <Badge variant="secondary" className="px-2 py-0 h-5 font-black bg-[var(--action)]/10 text-[var(--action)] border-none">
                            {userNovels.length}
                        </Badge>
                    </TabsTrigger>

                    <TabsTrigger
                        value="rewards"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--action)] data-[state=active]:bg-transparent bg-transparent px-2 h-full text-base font-bold transition-all relative gap-2"
                    >
                        Reward Hub
                        {user.lotteryChances > 0 && (
                            <Badge variant="secondary" className="px-2 py-0 h-5 font-black bg-red-500/10 text-red-500 border-none animate-pulse">
                                {user.lotteryChances}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="novels" className="mt-0 outline-none">
                    {/* 3. My Novels Section */}
                    <div className="mb-12">
                        <div className="flex justify-end mb-8">
                            <Link
                                href="/writer"
                                className="flex items-center gap-2 text-sm font-bold bg-[var(--action)] text-white px-6 py-3 rounded-full hover:scale-105 transition-all shadow-lg active:scale-95"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Write Novel
                            </Link>
                        </div>

                        {userNovels.length === 0 ? (
                            <div className="bg-[var(--surface-2)] rounded-[2.5rem] p-16 text-center border border-dashed border-[var(--border)]">
                                <div className="text-6xl mb-6">✍️</div>
                                <h3 className="text-2xl font-black text-[var(--foreground)] mb-3 tracking-tight">No novels yet</h3>
                                <p className="text-[var(--text-muted)] mb-8 max-w-sm mx-auto font-medium leading-relaxed">You haven&apos;t published any novels yet. Start your writing journey today and share your stories with the world!</p>
                                <Link
                                    href="/writer"
                                    className="inline-flex items-center gap-3 font-black uppercase tracking-widest bg-[var(--action)] text-white px-10 py-4 rounded-full hover:scale-105 transition-all shadow-xl active:scale-95"
                                >
                                    Start Writing
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 gap-y-10">
                                {userNovels.map((novel) => (
                                    <div key={novel.id} className="group flex flex-col">
                                        <Link href={`/novel/${novel.slug}`} className="block relative aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-lg mb-4 bg-[var(--surface-2)] border border-[var(--border)]">
                                            {novel.coverUrl ? (
                                                <img
                                                    src={novel.coverUrl}
                                                    alt={novel.title}
                                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center w-full h-full text-[var(--text-muted)] bg-[var(--surface-3)]">
                                                    <span className="text-4xl mb-2">📚</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">No Cover</span>
                                                </div>
                                            )}
                                            <div className="absolute top-3 left-3 flex gap-1">
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-md backdrop-blur-md ${novel.status === 'ongoing' ? 'bg-emerald-500/90' : 'bg-[var(--action)]/90'}`}>
                                                    {novel.status || 'Ongoing'}
                                                </span>
                                            </div>
                                        </Link>

                                        <h3 className="font-bold text-[var(--foreground)] leading-tight mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-[var(--action)] transition-colors">
                                            <Link href={`/novel/${novel.slug}`}>
                                                {novel.title}
                                            </Link>
                                        </h3>

                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]">
                                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {(novel.views || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="rewards" className="mt-0 outline-none">
                    <RewardHub user={user} />
                </TabsContent>
            </Tabs>

            <ProfileEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                initialData={{ name: user.name, image: user.image }}
            />
        </div>
    );
}
