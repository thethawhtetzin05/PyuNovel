"use client";

import { useState } from "react";
import { Link } from '@/i18n/routing';
import ProfileEditModal from "@/components/modals/ProfileEditModal";
import TelegramConnectForm from "@/components/telegram/TelegramConnectForm";

interface ProfileClientProps {
    user: any;
    userNovels: any[];
    joinedDate: string;
}

export default function ProfileClient({ user, userNovels, joinedDate }: ProfileClientProps) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 min-h-screen">

            {/* 1. Header & Profile Card */}
            <div className="bg-[var(--surface)] rounded-3xl p-8 sm:p-10 shadow-xl border border-[var(--border)] mb-12 flex flex-col sm:flex-row items-center sm:items-start gap-8 relative overflow-hidden">
                {/* Background decorative blob */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[var(--action)] opacity-10 blur-3xl pointer-events-none"></div>

                {/* Avatar */}
                <div className="shrink-0 relative z-10 group cursor-pointer" onClick={() => setIsEditModalOpen(true)}>
                    {user.image ? (
                        <img
                            src={user.image}
                            alt={user.name}
                            className="w-32 h-32 rounded-full object-cover border-4 border-[var(--surface)] shadow-lg transition-transform group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-32 h-32 rounded-full bg-[var(--surface-2)] text-[var(--action)] flex items-center justify-center text-4xl font-bold border-4 border-[var(--surface)] shadow-lg transition-transform group-hover:scale-105">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                        </svg>
                    </div>
                </div>

                {/* User Info */}
                <div className="flex-1 text-center sm:text-left z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-[var(--foreground)] mb-2 truncate">{user.name}</h1>
                            <p className="text-[var(--text-muted)] font-medium mb-4">{user.email}</p>
                        </div>
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="px-6 py-2.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-sm font-bold text-[var(--foreground)] hover:bg-[var(--surface-3)] transition-all active:scale-95 shrink-0"
                        >
                            Edit Profile
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
                        <span className="px-4 py-1.5 bg-[var(--surface-2)] text-[var(--foreground)] rounded-full text-[10px] font-black uppercase tracking-widest border border-[var(--border)] shadow-sm">
                            Role: {user.role || 'Reader'}
                        </span>
                        <span className="px-4 py-1.5 bg-[var(--action)]/10 text-[var(--action)] rounded-full text-[10px] font-black uppercase tracking-widest border border-[var(--action)]/20 shadow-sm">
                            🪙 {user.coins || 0} Coins
                        </span>
                        <span className="px-4 py-1.5 bg-[var(--surface-2)] text-[var(--text-muted)] rounded-full text-[10px] font-black tracking-widest border border-[var(--border)] shadow-sm uppercase">
                            Joined {joinedDate}
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. My Novels Section */}
            <div className="mb-12">
                <div className="flex justify-between items-end mb-8 border-b border-[var(--border)] pb-4">
                    <h2 className="text-2xl font-black text-[var(--foreground)]">
                        My Novels <span className="text-[var(--text-muted)] font-medium text-lg ml-2">({userNovels.length})</span>
                    </h2>
                    <Link
                        href="/writer"
                        className="hidden sm:flex items-center gap-2 text-sm font-bold bg-[var(--action)] text-white px-6 py-3 rounded-full hover:scale-105 transition-all shadow-lg active:scale-95"
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
                        <p className="text-[var(--text-muted)] mb-8 max-w-sm mx-auto font-medium leading-relaxed">You haven't published any novels yet. Start your writing journey today and share your stories with the world!</p>
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

                                    <Link
                                        href={`/novel/${novel.slug}/edit`}
                                        className="text-[10px] font-black uppercase tracking-widest text-[var(--action)] hover:text-white hover:bg-[var(--action)] border border-[var(--action)]/30 px-4 py-1.5 rounded-full transition-all"
                                    >
                                        Edit
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ProfileEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                initialData={{ name: user.name, image: user.image }}
            />

            {/* 3. Settings Section */}
            <div className="border-t border-[var(--border)] pt-12 mt-4">
                <h2 className="text-2xl font-black text-[var(--foreground)] mb-2">
                    Integrations & Settings
                </h2>
                <TelegramConnectForm
                    isLinked={Boolean(user.telegramId && typeof user.telegramId === 'string' && user.telegramId.trim() !== "" && user.telegramId.trim() !== "null" && user.telegramId.trim() !== "undefined")}
                    tgName={user.telegramName}
                    tgUsername={user.telegramUsername}
                />
            </div>
        </div>
    );
}
