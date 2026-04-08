"use client";

import { useState, useEffect } from "react";
import { Menu, X, Home, Users, Coins, Megaphone, LogOut, Book } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function AdminMobileMenu({ 
    logoutAction 
}: { 
    logoutAction: () => Promise<void> 
}) {
    const [isOpen, setIsOpen] = useState(false);

    // Prevent scrolling when mobile menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <div className="md:hidden">
            {/* Mobile Header Bar */}
            <header className="flex items-center justify-between p-4 bg-[var(--surface)] border-b border-[var(--border)] sticky top-0 z-[100] shadow-sm">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">⚡</span>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--action)] to-purple-500">
                        Admin
                    </span>
                </div>
                <button 
                    onClick={() => setIsOpen(true)}
                    className="p-2 text-[var(--text-muted)] hover:bg-[var(--surface-2)] rounded-xl transition-all active:scale-95"
                    aria-label="Open menu"
                >
                    <Menu size={24} />
                </button>
            </header>

            {/* Mobile Sidebar Overlay */}
            <div 
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setIsOpen(false)}
            />

            {/* Mobile Sidebar Panel */}
            <aside 
                className={`fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-[var(--surface)] z-[120] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col shadow-2xl ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">⚡</span>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold leading-none bg-clip-text text-transparent bg-gradient-to-r from-[var(--action)] to-purple-500">
                                Admin Panel
                            </span>
                            <span className="text-xs text-[var(--text-muted)] mt-1">v1.2.0</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-[var(--text-muted)] hover:bg-[var(--surface-2)] rounded-xl transition-all active:scale-90"
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
                    <Link 
                        href="/" 
                        onClick={() => setIsOpen(false)} 
                        className="flex items-center gap-4 px-4 py-4 text-[var(--text-muted)] hover:bg-[var(--surface-2)] rounded-2xl transition-all active:scale-[0.98]"
                    >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Home size={20} />
                        </div>
                        <span className="font-semibold">Main Site</span>
                    </Link>

                    <div className="h-px bg-[var(--border)] my-2 opacity-50" />

                    <Link 
                        href="/admin/users" 
                        onClick={() => setIsOpen(false)} 
                        className="flex items-center gap-4 px-4 py-4 text-[var(--text-muted)] hover:bg-[var(--surface-2)] rounded-2xl transition-all active:scale-[0.98]"
                    >
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                            <Users size={20} />
                        </div>
                        <span className="font-semibold">User Stats</span>
                    </Link>

                    <Link 
                        href="/admin/novels" 
                        onClick={() => setIsOpen(false)} 
                        className="flex items-center gap-4 px-4 py-4 text-[var(--text-muted)] hover:bg-[var(--surface-2)] rounded-2xl transition-all active:scale-[0.98]"
                    >
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
                            <Book size={20} />
                        </div>
                        <span className="font-semibold">Novel Stats</span>
                    </Link>

                    <Link 
                        href="/admin/coins" 
                        onClick={() => setIsOpen(false)} 
                        className="flex items-center gap-4 px-4 py-4 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/20 rounded-2xl transition-all active:scale-[0.98]"
                    >
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                            <Coins size={20} />
                        </div>
                        <span className="font-bold">Coin Management</span>
                    </Link>

                    <Link 
                        href="/admin/announcements" 
                        onClick={() => setIsOpen(false)} 
                        className="flex items-center gap-4 px-4 py-4 bg-[var(--action)]/10 text-[var(--action)] rounded-2xl transition-all active:scale-[0.98]"
                    >
                        <div className="w-10 h-10 rounded-xl bg-[var(--action)]/10 text-[var(--action)] flex items-center justify-center">
                            <Megaphone size={20} />
                        </div>
                        <span className="font-bold">Announcements</span>
                    </Link>
                </nav>

                <div className="p-6 border-t border-[var(--border)] bg-slate-50/50 dark:bg-slate-900/50">
                    <button 
                        onClick={async () => {
                            setIsOpen(false);
                            await logoutAction();
                        }}
                        className="flex items-center gap-4 px-4 py-4 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all w-full text-left font-bold active:scale-[0.98]"
                    >
                        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center">
                            <LogOut size={20} />
                        </div>
                        Sign Out
                    </button>
                </div>
            </aside>
        </div>
    );
}
