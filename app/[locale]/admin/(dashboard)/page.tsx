import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const runtime = 'edge';

export default async function AdminPage() {
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get('admin_session')?.value === 'authenticated';

    if (!isAdmin) {
        redirect('/en/admin/login');
    }

    // Redirect top level /admin directly to /admin/announcements
    redirect('/en/admin/announcements');
}
