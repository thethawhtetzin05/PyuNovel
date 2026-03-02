'use server';

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getRequestContext } from "@cloudflare/next-on-pages";

export type AdminLoginResult =
    | { error: string; redirectTo?: never }
    | { redirectTo: string; error?: never };

export async function loginWithAdminKey(key: string, locale: string = 'en'): Promise<AdminLoginResult> {
    try {
        const context = getRequestContext();
        const correctKey = context?.env?.ADMIN_SECRET_KEY || process.env.ADMIN_SECRET_KEY;

        if (!correctKey) {
            return { error: 'ADMIN_SECRET_KEY is missing in Cloudflare Environment.' };
        }

        if (key.trim() !== correctKey.trim()) {
            return { error: 'Invalid admin key. Please check again.' };
        }

        // Set secure HTTP-only cookie
        const cookieStore = await cookies();
        cookieStore.set('admin_session', 'authenticated', {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        // Return the redirect URL to the client instead of calling redirect() directly.
        // Calling redirect() inside a server action invoked directly from a client component
        // causes the promise to hang in Cloudflare Edge Runtime.
        return { redirectTo: `/${locale}/admin/announcements` };
    } catch (e) {
        console.error('[LOGIN_ADMIN]', e);
        return { error: 'An unexpected server error occurred.' };
    }
}

export async function logoutAdmin(locale: string = 'en') {
    (await cookies()).delete('admin_session');
    redirect(`/${locale}/admin/login`);
}
