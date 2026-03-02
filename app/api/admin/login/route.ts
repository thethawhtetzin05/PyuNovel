import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const { key, locale } = await req.json() as { key: string; locale: string };

        const { env } = getRequestContext();
        const correctKey = env?.ADMIN_SECRET_KEY || process.env.ADMIN_SECRET_KEY;

        if (!correctKey) {
            return NextResponse.json({ error: 'Server is misconfigured. ADMIN_SECRET_KEY missing.' }, { status: 500 });
        }

        if (!key || key.trim() !== correctKey.trim()) {
            return NextResponse.json({ error: 'Invalid admin key. Please check again.' }, { status: 401 });
        }

        // Build the response and set the session cookie on it
        const response = NextResponse.json({ redirectTo: `/${locale}/admin/announcements` });
        response.cookies.set('admin_session', 'authenticated', {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });

        return response;
    } catch (error) {
        console.error('[ADMIN_LOGIN]', error);
        return NextResponse.json({ error: 'An unexpected server error occurred.' }, { status: 500 });
    }
}
