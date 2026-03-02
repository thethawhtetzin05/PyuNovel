'use server';

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getRequestContext } from "@cloudflare/next-on-pages";

export async function loginWithAdminKey(key: string, locale: string = 'en') {
    let success = false;
    let errorMsg = '';

    const context = getRequestContext();
    const correctKey = context?.env?.ADMIN_SECRET_KEY || process.env.ADMIN_SECRET_KEY;

    if (!correctKey) {
        return { error: 'ADMIN_SECRET_KEY is missing in Cloudflare Environment.' };
    }

    if (key.trim() === correctKey.trim()) {
        success = true;
    } else {
        errorMsg = 'Invalid admin key. Please check again.';
    }

    if (success) {
        // Set secure HTTP-only cookie
        const cookieStore = await cookies();
        cookieStore.set('admin_session', 'authenticated', {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        // IMPORTANT: Redirect must happen outside of try-catch in some Next.js versions
        // but since we are in a server action, calling it here is usually fine.
        redirect(`/${locale}/admin/announcements`);
    }

    return { error: errorMsg };
}

export async function logoutAdmin(locale: string = 'en') {
    (await cookies()).delete('admin_session');
    redirect(`/${locale}/admin/login`);
}
