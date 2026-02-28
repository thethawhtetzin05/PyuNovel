'use server';

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getRequestContext } from "@cloudflare/next-on-pages";

export async function loginWithAdminKey(key: string) {
    let correctKey = process.env.ADMIN_SECRET_KEY;

    try {
        const { env } = getRequestContext();
        if (env && env.ADMIN_SECRET_KEY) {
            correctKey = env.ADMIN_SECRET_KEY;
        }
    } catch (error) {
        // ignore if getRequestContext is not available
    }

    if (!correctKey) {
        console.error("ADMIN_SECRET_KEY is not set in the environment.");
        return { error: 'Server configuration error: Key not found in environment variables.' };
    }

    if (key.trim() !== correctKey.trim()) {
        return { error: 'Invalid admin key' };
    }

    // Set secure HTTP-only cookie
    (await cookies()).set('admin_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    redirect('/en/admin/announcements');
}

export async function logoutAdmin() {
    (await cookies()).delete('admin_session');
    redirect('/en/admin/login');
}
