'use server';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';
import { chapters, novels } from '@/db/schema';
import { eq, and, max } from 'drizzle-orm';
import { createAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { parseChaptersFromText } from '@/lib/utils';

export type BulkUploadResult =
    | { success: true; count: number }
    | { success: false; error: string };

export async function bulkUploadChaptersAction(
    novelId: number,
    novelSlug: string,
    parsedChapters: { title: string; content: string }[]
): Promise<BulkUploadResult> {
    const { env } = getRequestContext();
    const db = drizzle(env.DB, { schema });

    const auth = createAuth(env.DB);
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false, error: 'Not authenticated.' };

    const novel = await db.query.novels.findFirst({
        where: (n, { eq, and }) => and(eq(n.id, novelId), eq(n.ownerId, session.user.id)),
    });
    if (!novel) return { success: false, error: 'Novel not found or you do not own it.' };

    if (!parsedChapters || parsedChapters.length === 0) return { success: false, error: 'No chapters to upload.' };

    // ၆။ Last sortIndex ယူပြီး ဆက်ပေါင်းမယ်
    const lastIndexRow = await db
        .select({ val: max(chapters.sortIndex) })
        .from(chapters)
        .where(eq(chapters.novelId, novelId))
        .get();
    const startIndex = (lastIndexRow?.val ?? 0) + 1;

    // ၇။ Batch Insert with Chunking (D1 message size limits ရှောင်ဖို့)
    try {
        const rows = parsedChapters.map((ch, i) => ({
            novelId,
            title: ch.title,
            content: ch.content,
            sortIndex: startIndex + i,
            isPaid: false,
            createdAt: new Date(),
        }));

        // Chunking: 50 rows per insert
        const chunkSize = 50;
        for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);
            await db.insert(chapters).values(chunk);
        }

    } catch (e: any) {
        console.error("Bulk upload DB error:", e);
        return { success: false, error: `Database error: ${e?.message ?? 'Unknown error'}` };
    }

    revalidatePath(`/novel/${novelSlug}`);
    return { success: true, count: parsedChapters.length };
}
