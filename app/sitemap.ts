import { MetadataRoute } from 'next';
import { drizzle } from 'drizzle-orm/d1';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { novels } from '@/db/schema';
import { desc } from 'drizzle-orm';

export const runtime = 'edge';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pyunovel.com';
    let novelUrls: MetadataRoute.Sitemap = [];

    try {
        const { env } = getRequestContext();
        if (env?.DB) {
            const db = drizzle(env.DB);
            const latestNovels = await db.select().from(novels).orderBy(desc(novels.updatedAt)).limit(500).all();
            novelUrls = latestNovels.map((novel) => ({
                url: `${baseUrl}/novel/${novel.slug}`,
                lastModified: novel.updatedAt || new Date(),
                changeFrequency: 'daily' as const,
                priority: 0.8,
            }));
        }
    } catch (error) {
        console.warn("Skipping DB sitemap generation (likely during build phase)");
    }

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'always',
            priority: 1,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        ...novelUrls,
    ];
}
