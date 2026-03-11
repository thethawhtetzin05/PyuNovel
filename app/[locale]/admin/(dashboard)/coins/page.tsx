import { getRequestContext } from '@cloudflare/next-on-pages';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';
import { createAuth } from '@/lib/auth';
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import CoinManagementPanel from '@/components/admin/CoinManagementPanel';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function AdminCoinsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get('admin_session')?.value === 'authenticated';

    if (!isAdmin) {
        redirect(`/${locale}/admin/login`);
    }

    const { env } = getRequestContext();
    const db = drizzle(env.DB, { schema });

    // Fetch total circulating coins
    const allUsers = await db.query.user.findMany({
        columns: {
            id: true,
            name: true,
            email: true,
            coins: true,
            image: true
        },
        orderBy: (users, { desc }) => [desc(users.coins)]
    });

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
            <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight mb-2">Coin Management</h1>
            <p className="text-[var(--text-muted)] mb-8 font-medium">Manually grant or deduct coins for users.</p>

            <CoinManagementPanel users={allUsers as any} />
        </div>
    );
}
