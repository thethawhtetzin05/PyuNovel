import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
    // A list of all locales that are supported
    locales: ['en', 'my'],

    // Used when no locale matches
    defaultLocale: 'en'
});

export default function middleware(req: NextRequest) {
    const hostname = req.headers.get('host') || '';

    // Redirect pyunovel.pages.dev → pyunovel.com permanently (301)
    if (hostname.includes('pyunovel.pages.dev')) {
        const url = req.nextUrl.clone();
        url.hostname = 'pyunovel.com';
        url.port = '';
        return NextResponse.redirect(url, 301);
    }

    return intlMiddleware(req);
}

export const config = {
    // Match all pathnames except for
    // - API routes
    // - Static files (_next, images, etc.)
    // - _vercel (specific for Vercel)
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)',]
};
