import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminLoginForm from './AdminLoginForm';

export const runtime = 'edge';
export default async function AdminLoginPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get('admin_session')?.value === 'authenticated';

    // If already authenticated, redirect away from the login page!
    if (isAdmin) {
        redirect(`/${locale}/admin/announcements`);
    }

    return <AdminLoginForm />;
}
