import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pyunovel.com';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/profile/', '/sign-in', '/novel/create'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
