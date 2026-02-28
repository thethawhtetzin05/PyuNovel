/**
 * lib/offline/sync.ts
 * Novel data ကို server ကနေ download လုပ်ပြီး local SQLite ထဲ save မယ်
 */

import { getOfflineDb, isNativePlatform } from './db';

// Download API ကနေ return ပြန်မယ့် data structure
export interface DownloadPayload {
    novel: {
        id: number;
        slug: string;
        title: string;
        englishTitle: string;
        author: string;
        description: string | null;
        coverUrl: string | null;
        tags: string;
        status: string;
        views: number;
    };
    volumes: Array<{
        id: number;
        novelId: number;
        name: string;
        sortIndex: number;
    }>;
    chapters: Array<{
        id: number;
        novelId: number;
        volumeId: number | null;
        title: string;
        content: string;
        isPaid: boolean;
        sortIndex: number;
    }>;
}

/**
 * Novel တစ်ခုကို server ကနေ download လုပ်ပြီး local DB ထဲ save မယ်
 */
export async function downloadNovel(
    slug: string,
    onProgress?: (step: string) => void
): Promise<{ success: boolean; error?: string }> {
    if (!isNativePlatform()) {
        return { success: false, error: 'Offline feature is only available on mobile app' };
    }

    try {
        onProgress?.('Connecting to server...');

        // Server ကနေ download လုပ်မယ်
        const res = await fetch(`/api/novel/${slug}/download`);

        if (!res.ok) {
            if (res.status === 401) return { success: false, error: 'Please sign in to download' };
            if (res.status === 404) return { success: false, error: 'Novel not found' };
            return { success: false, error: 'Download failed. Please try again.' };
        }

        const data: DownloadPayload = await res.json();

        onProgress?.('Saving to device...');

        const db = await getOfflineDb();
        if (!db) return { success: false, error: 'Could not open local database' };

        const now = Date.now();

        // Transaction ထဲမှာ အကုန် insert မယ် (atomic)
        await db.beginTransaction();
        try {
            // ① Novel record — ရှိပြီးသားဆိုရင် replace မယ်
            await db.run(
                `INSERT OR REPLACE INTO novels_offline
                  (id, slug, title, english_title, author, description, cover_url, tags, status, views, downloaded_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [data.novel.id, data.novel.slug, data.novel.title,
                data.novel.englishTitle, data.novel.author,
                data.novel.description ?? '', data.novel.coverUrl ?? '',
                data.novel.tags, data.novel.status, data.novel.views, now]
            );

            // ② Old volumes/chapters ဖျက်မယ် (fresh download)
            await db.run(`DELETE FROM volumes_offline WHERE novel_id = ?`, [data.novel.id]);
            await db.run(`DELETE FROM chapters_offline WHERE novel_id = ?`, [data.novel.id]);

            // ③ Volumes insert
            for (const v of data.volumes) {
                await db.run(
                    `INSERT INTO volumes_offline (id, novel_id, name, sort_index) VALUES (?, ?, ?, ?)`,
                    [v.id, v.novelId, v.name, v.sortIndex]
                );
            }

            // ④ Chapters insert
            for (const c of data.chapters) {
                await db.run(
                    `INSERT INTO chapters_offline (id, novel_id, volume_id, title, content, is_paid, sort_index)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [c.id, c.novelId, c.volumeId ?? null, c.title, c.content, c.isPaid ? 1 : 0, c.sortIndex]
                );
            }

            await db.commitTransaction();
        } catch (txErr) {
            await db.rollbackTransaction();
            throw txErr;
        }


        onProgress?.('Done!');
        return { success: true };
    } catch (err) {
        console.error('[Sync] downloadNovel error:', err);
        return { success: false, error: 'Unexpected error during download' };
    }
}

/**
 * Downloaded novel ကို local DB ကနေ ဖျက်မယ်
 */
export async function deleteOfflineNovel(slug: string): Promise<boolean> {
    if (!isNativePlatform()) return false;

    const db = await getOfflineDb();
    if (!db) return false;

    try {
        const result = await db.query(
            `SELECT id FROM novels_offline WHERE slug = ? LIMIT 1`,
            [slug]
        );

        if (!result.values || result.values.length === 0) return false;

        const novelId = result.values[0].id;
        await db.run(`DELETE FROM novels_offline WHERE id = ?`, [novelId]);
        return true;
    } catch (err) {
        console.error('[Sync] deleteOfflineNovel error:', err);
        return false;
    }
}

/**
 * Novel ကို download လုပ်ထားဖြစ်မဖြစ် စစ်မယ်
 */
export async function isNovelDownloaded(slug: string): Promise<boolean> {
    if (!isNativePlatform()) return false;

    const db = await getOfflineDb();
    if (!db) return false;

    try {
        const result = await db.query(
            `SELECT id FROM novels_offline WHERE slug = ? LIMIT 1`,
            [slug]
        );
        return (result.values?.length ?? 0) > 0;
    } catch {
        return false;
    }
}

/**
 * Download ထားတဲ့ novel အားလုံးရဲ့ slug list ယူမယ်
 */
export async function getAllDownloadedSlugs(): Promise<string[]> {
    if (!isNativePlatform()) return [];

    const db = await getOfflineDb();
    if (!db) return [];

    try {
        const result = await db.query(`SELECT slug FROM novels_offline`);
        return (result.values ?? []).map((r) => r.slug as string);
    } catch {
        return [];
    }
}
