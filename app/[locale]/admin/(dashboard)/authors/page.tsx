import { getRequestContext } from '@cloudflare/next-on-pages';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';
import { getAuthorsList } from '@/lib/resources/users/queries';
import AuthorsDashboard from '@/components/admin/AuthorsDashboard';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function AdminAuthorsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get('admin_session')?.value === 'authenticated';

    if (!isAdmin) {
        redirect(`/${locale}/admin/login`);
    }

    const { env } = getRequestContext();
    const db = drizzle(env.DB, { schema });

    // Fetch the list of authors and KPI metrics
    const { authors, metrics } = await getAuthorsList(db);

    return (
        <div className="px-5 py-6 md:px-10 md:py-12 max-w-6xl mx-auto">
            <AuthorsDashboard authors={authors} metrics={metrics} />
        </div>
    );
}
