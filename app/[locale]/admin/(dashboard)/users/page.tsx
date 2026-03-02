import { getRequestContext } from '@cloudflare/next-on-pages';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';
import { getUserStatistics } from '@/lib/resources/users/queries';
import UserStatsDashboard from '@/components/admin/UserStatsDashboard';
import { createAuth } from '@/lib/auth';
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get('admin_session')?.value === 'authenticated';

    if (!isAdmin) {
        redirect(`/${locale}/admin/login`);
    }

    const { env } = getRequestContext();
    const db = drizzle(env.DB, { schema });

    // Fetch the statistics
    const stats = await getUserStatistics(db);

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
            <UserStatsDashboard stats={stats} />
        </div>
    );
}
