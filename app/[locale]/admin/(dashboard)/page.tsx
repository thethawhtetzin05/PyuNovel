import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const runtime = 'edge';

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get('admin_session')?.value === 'authenticated';

    if (!isAdmin) {
        redirect(`/${locale}/admin/login`);
    }

    // Redirect top level /admin directly to /admin/announcements
    redirect(`/${locale}/admin/announcements`);
}
