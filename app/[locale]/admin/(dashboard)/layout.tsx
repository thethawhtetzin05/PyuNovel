import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Home, Megaphone, Settings, Users, Settings2, LogOut, Coins } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { logoutAdmin } from '../actions';

export default async function AdminLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get('admin_session')?.value === 'authenticated';

    // Protect Admin Routes
    // If we are already on the login page, don't redirect again
    // We handle this loosely here since the layout wraps the login page too in this structure
    // Actually, wait, layout.tsx in /admin wraps /admin/login too. We need to handle this conditionally or move login out
    // Let's redirect if NOT authenticated AND NOT on login page.
    // Next.js layout doesn't easily know the exact child route without passing it down.
    // Best practice: protect in middleware OR inside the children pages OR separate login layout.

    // Quick fix: we will check this inside the child pages instead of layout to avoid infinite loop on /admin/login
    return (
        <div className="flex bg-[var(--background)] min-h-screen">
            {/* Sidebar - Only show if authenticated */}
            {isAdmin && (
                <aside className="w-64 bg-[var(--surface)] border-r border-[var(--border)] min-h-screen p-6 hidden md:block">
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
                            <span className="font-medium">Users Stats</span>
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
                        action={async () => {
                            'use server';
                            const { locale } = await params;
                            await logoutAdmin(locale);
                        }}
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
            <main className="flex-1 min-w-0">
                {children}
            </main>
        </div>
    );
}
