/**
 * app/api/novel/[slug]/download/route.ts
 * Novel တစ်ခုရဲ့ data အကုန် (novel + volumes + chapters) ကို
 * single response တစ်ခုနဲ့ return မယ် — offline download အတွက်
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';
import { createAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getNovelBySlug } from '@/lib/resources/novels/queries';
import { getVolumesByNovelId } from '@/lib/resources/volumes/queries';
import { chapters as chaptersTable } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export const runtime = 'edge';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { env } = getRequestContext();
        const db = drizzle(env.DB, { schema });
        const { slug } = await params;

        // Auth စစ်မယ် — Login မဖြစ်ဘဲ download မရ
        const auth = createAuth(env.DB);
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Please sign in to download novels for offline reading' },
                { status: 401 }
            );
        }

        // Novel ရှာမယ်
        const novel = await getNovelBySlug(db, slug);
        if (!novel) {
            return NextResponse.json({ error: 'Novel not found' }, { status: 404 });
        }

        // Volumes + Chapters ယူမယ် (parallel fetch)
        // Note: content + novelId ပါဖို့ direct query သုံးမယ်
        const [volumes, chapters] = await Promise.all([
            getVolumesByNovelId(db, novel.id),
            db.select({
                id: chaptersTable.id,
                novelId: chaptersTable.novelId,
                volumeId: chaptersTable.volumeId,
                title: chaptersTable.title,
                content: chaptersTable.content,
                isPaid: chaptersTable.isPaid,
                sortIndex: chaptersTable.sortIndex,
            })
                .from(chaptersTable)
                .where(eq(chaptersTable.novelId, novel.id))
                .orderBy(asc(chaptersTable.sortIndex))
                .all(),
        ]);

        // Clean payload — sensitive fields မပါအောင် စစ်မယ်
        const payload = {
            novel: {
                id: novel.id,
                slug: novel.slug,
                title: novel.title,
                englishTitle: novel.englishTitle,
                author: novel.author,
                description: novel.description ?? null,
                coverUrl: novel.coverUrl ?? null,
                tags: novel.tags,
                status: novel.status ?? 'ongoing',
                views: novel.views ?? 0,
            },
            volumes: volumes.map((v) => ({
                id: v.id,
                novelId: v.novelId,
                name: v.name,
                sortIndex: v.sortIndex,
            })),
            chapters: chapters.map((c) => ({
                id: c.id,
                novelId: c.novelId,
                volumeId: c.volumeId ?? null,
                title: c.title,
                content: c.content,
                isPaid: c.isPaid ?? false,
                sortIndex: c.sortIndex,
            })),
        };

        return NextResponse.json(payload, {
            headers: {
                // Browser cache မသိမ်းဖို့
                'Cache-Control': 'no-store',
            },
        });
    } catch (err) {
        console.error('[Download API] Error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
