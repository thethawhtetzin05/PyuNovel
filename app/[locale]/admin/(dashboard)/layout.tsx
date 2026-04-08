import { cookies } from 'next/headers';
import { Home, Megaphone, Users, LogOut, Coins, Book } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { logoutAdmin } from '../actions';
import AdminMobileMenu from '@/components/admin/AdminMobileMenu';

export default async function AdminLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get('admin_session')?.value === 'authenticated';

    const handleLogout = async () => {
        'use server';
        const { locale } = await params;
        await logoutAdmin(locale);
    };

    return (
        <div className="flex flex-col md:flex-row bg-[var(--background)] min-h-screen">
            {/* Mobile Header & Menu */}
            {isAdmin && <AdminMobileMenu logoutAction={handleLogout} />}

            {/* Sidebar for Desktop - Only show if authenticated */}
            {isAdmin && (
                <aside className="w-64 bg-[var(--surface)] border-r border-[var(--border)] min-h-screen p-6 hidden md:block sticky top-0 overflow-y-auto">
                    <div className="flex items-center gap-3 mb-10">
                        <span className="text-2xl">⚡</span>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--action)] to-purple-500">
                            Admin Panel
                        </span>
                    </div>

                    <nav className="space-y-2">
                        <Link href="/" className="flex items-center gap-3 px-4 py-3 text-[var(--text-muted)] hover:bg-[var(--surface-2)] rounded-xl transition">
                            <Home size={18} />
                            <span className="font-medium">Main Site</span>
                        </Link>
                        <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 text-[var(--text-muted)] hover:bg-[var(--surface-2)] rounded-xl transition">
                            <Users size={18} />
                            <span className="font-medium">User Stats</span>
                        </Link>
                        <Link href="/admin/novels" className="flex items-center gap-3 px-4 py-3 text-[var(--text-muted)] hover:bg-[var(--surface-2)] rounded-xl transition">
                            <Book size={18} />
                            <span className="font-medium">Novel Stats</span>
                        </Link>
                        <Link href="/admin/coins" className="flex items-center gap-3 px-4 py-3 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-xl transition">
                            <Coins size={18} />
                            <span className="font-bold">Coin Management</span>
                        </Link>
                        <Link href="/admin/announcements" className="flex items-center gap-3 px-4 py-3 bg-[var(--action)]/10 text-[var(--action)] rounded-xl transition">
                            <Megaphone size={18} />
                            <span className="font-bold">Announcements</span>
                        </Link>
                    </nav>

                    <form
                        action={handleLogout}
                        className="mt-8 pt-8 border-t border-[var(--border)]"
                    >
                        <button type="submit" className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition w-full text-left font-medium">
                            <LogOut size={18} />
                            Sign Out
                        </button>
                    </form>
                </aside>
            )}

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 overflow-x-hidden">
                {/* 
                    No base padding here because child pages have their own max-w and p-6/p-8. 
                    However, we add a bit of top margin on mobile to separate from header 
                */}
                <div className="pb-10 pt-4 md:pt-0">
                    {children}
                </div>
            </main>
        </div>
    );
}
