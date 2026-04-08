import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { drizzle } from 'drizzle-orm/d1';
import { getLatestAnnouncements } from '@/lib/resources/announcements/queries';
import { createAnnouncement, deleteAnnouncement } from './actions';
import { Plus, Trash2, Megaphone, AlertCircle } from 'lucide-react';

export const runtime = 'edge';

export default async function AnnouncementsAdminPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get('admin_session')?.value === 'authenticated';

    if (!isAdmin) {
        redirect(`/${locale}/admin/login`);
    }

    const { env } = getRequestContext();
    const db = drizzle(env.DB);

    // Fetch up to 20 recent active announcements for admin view
    const items = await getLatestAnnouncements(db, 20);

    return (
        <div className="px-5 py-6 md:px-10 md:py-12 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between items-start md:items-end mb-10 border-b border-[var(--border)] pb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--foreground)] flex items-center gap-3">
                        <Megaphone className="text-[var(--action)]" size={32} />
                        Announcements
                    </h1>
                    <p className="text-[var(--text-muted)] mt-2 font-medium">Create and manage alerts shown on the homepage sidebar.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Create Form */}
                <div className="lg:col-span-1">
                    <div className="bg-[var(--surface)] p-6 rounded-2xl shadow-sm border border-[var(--border)] sticky top-8">
                        <h2 className="text-xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-2">
                            <Plus size={20} className="text-[var(--action)]" />
                            New Announcement
                        </h2>

                        <form action={async (formData) => {
                            'use server';
                            await createAnnouncement(formData);
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-[var(--foreground)] mb-1">Icon (Emoji)</label>
                                <input
                                    type="text"
                                    name="icon"
                                    placeholder="e.g. 📢 or 🔥"
                                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[var(--action)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[var(--foreground)] mb-1">Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    placeholder="System Update"
                                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[var(--action)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[var(--foreground)] mb-1">Content (Optional)</label>
                                <textarea
                                    name="content"
                                    rows={3}
                                    placeholder="Details about the announcement..."
                                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[var(--action)] resize-none"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <input type="checkbox" name="isActive" id="isActive" defaultChecked className="w-5 h-5 rounded border-[var(--border)] text-[var(--action)] focus:ring-[var(--action)]" />
                                <label htmlFor="isActive" className="text-sm font-medium text-[var(--foreground)] cursor-pointer">Set Active Immediately</label>
                            </div>

                            <button type="submit" className="w-full bg-[var(--action)] text-white py-3 rounded-xl font-bold hover:opacity-90 transition mt-4">
                                Publish Announcement
                            </button>
                        </form>
                    </div>
                </div>

                {/* Existing List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">Active Announcements ({items.length})</h2>

                    {items.length === 0 ? (
                        <div className="bg-[var(--surface-2)] border border-[var(--border)] border-dashed rounded-2xl p-12 text-center text-[var(--text-muted)]">
                            <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="font-medium text-lg">No active announcements</p>
                            <p className="text-sm mt-1">Fill out the form to create one.</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-sm flex items-start gap-4 transition hover:border-[var(--action)] group">
                                <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-2xl flex-shrink-0">
                                    {item.icon || '📢'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-[var(--foreground)] text-lg truncate">{item.title}</h3>
                                    {item.content && (
                                        <p className="text-[var(--text-muted)] text-sm line-clamp-2 mt-1">{item.content}</p>
                                    )}
                                    <p className="text-xs text-[var(--text-muted)] mt-2 opacity-60 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        Active • {new Date(item.createdAt || '').toLocaleDateString()}
                                    </p>
                                </div>

                                <form action={async () => {
                                    'use server';
                                    await deleteAnnouncement(item.id);
                                }}>
                                    <button type="submit" className="p-2.5 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-xl transition opacity-50 group-hover:opacity-100" title="Delete">
                                        <Trash2 size={18} />
                                    </button>
                                </form>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}
