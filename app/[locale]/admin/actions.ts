'use server';

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getRequestContext } from "@cloudflare/next-on-pages";

export async function loginWithAdminKey(key: string) {
    try {
        let correctKey = process.env.ADMIN_SECRET_KEY;

        // Cloudflare Pages Environment Variables Access
        try {
            const context = getRequestContext();
            if (context?.env?.ADMIN_SECRET_KEY) {
                correctKey = context.env.ADMIN_SECRET_KEY;
            }
        } catch (e) {
            // Potential fallback for different environments
        }

        if (!correctKey) {
            return { error: 'ADMIN_SECRET_KEY not found. Did you re-deploy after adding it in Cloudflare Dashboard?' };
        }

        if (key.trim() !== correctKey.trim()) {
            return { error: 'Invalid admin key. Please double check.' };
        }

        // Set secure HTTP-only cookie
        (await cookies()).set('admin_session', 'authenticated', {
            httpOnly: true,
            secure: true, // Always true for production pages.dev
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        // Redirect to dashboard
        redirect('/en/admin/announcements');

    } catch (error) {
        // Essential for Next.js redirect mechanism
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
            throw error;
        }
        console.error("Admin login error:", error);
        return { error: 'An unexpected server error occurred. Please try again.' };
    }
}

export async function logoutAdmin() {
    (await cookies()).delete('admin_session');
    redirect('/en/admin/login');
}
