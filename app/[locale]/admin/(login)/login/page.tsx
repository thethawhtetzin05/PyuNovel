import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminLoginForm from './AdminLoginForm';

export const runtime = 'edge';

export default async function AdminLoginPage() {
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get('admin_session')?.value === 'authenticated';

    // If already authenticated, redirect away from the login page!
    if (isAdmin) {
        redirect('/en/admin/announcements');
    }

    return <AdminLoginForm />;
}
