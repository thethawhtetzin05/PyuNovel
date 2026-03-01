import { getRequestContext } from '@cloudflare/next-on-pages';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';
import { getUserStatistics } from '@/lib/resources/users/queries';
import UserStatsDashboard from '@/components/admin/UserStatsDashboard';
import { createAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
    const { env } = getRequestContext();
    const db = drizzle(env.DB, { schema });

    // Validate Admin Session
    const auth = createAuth(env.DB);
    const session = await auth.api.getSession({ headers: await headers() });

    if (session?.user?.role !== 'admin') {
        redirect('/admin/login');
    }

    // Fetch the statistics
    const stats = await getUserStatistics(db);

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
            <UserStatsDashboard stats={stats} />
        </div>
    );
}
