/**
 * lib/offline/reader.ts
 * Local SQLite ကနေ chapter/novel data ဖတ်မယ်
 */

import { getOfflineDb, isNativePlatform } from './db';

export interface OfflineNovel {
    id: number;
    slug: string;
    title: string;
    englishTitle: string;
    author: string;
    description: string;
    coverUrl: string;
    tags: string;
    status: string;
    views: number;
    downloadedAt: number;
}

export interface OfflineVolume {
    id: number;
    novelId: number;
    name: string;
    sortIndex: number;
}

export interface OfflineChapter {
    id: number;
    novelId: number;
    volumeId: number | null;
    title: string;
    content: string;
    isPaid: boolean;
    sortIndex: number;
}

/**
 * Offline novel metadata ဖတ်မယ်
 */
export async function getOfflineNovel(slug: string): Promise<OfflineNovel | null> {
    if (!isNativePlatform()) return null;

    const db = await getOfflineDb();
    if (!db) return null;

    try {
        const result = await db.query(
            `SELECT * FROM novels_offline WHERE slug = ? LIMIT 1`,
            [slug]
        );

        if (!result.values || result.values.length === 0) return null;

        const row = result.values[0];
        return {
            id: row.id,
            slug: row.slug,
            title: row.title,
            englishTitle: row.english_title,
            author: row.author,
            description: row.description ?? '',
            coverUrl: row.cover_url ?? '',
            tags: row.tags ?? '',
            status: row.status,
            views: row.views,
            downloadedAt: row.downloaded_at,
        };
    } catch (err) {
        console.error('[Reader] getOfflineNovel error:', err);
        return null;
    }
}

/**
 * Novel ရဲ့ chapters list ဖတ်မယ် (content မပါ)
 */
export async function getOfflineChapterList(novelId: number): Promise<Omit<OfflineChapter, 'content'>[]> {
    if (!isNativePlatform()) return [];

    const db = await getOfflineDb();
    if (!db) return [];

    try {
        const result = await db.query(
            `SELECT id, novel_id, volume_id, title, is_paid, sort_index
       FROM chapters_offline
       WHERE novel_id = ?
       ORDER BY sort_index ASC`,
            [novelId]
        );

        return (result.values ?? []).map((row) => ({
            id: row.id,
            novelId: row.novel_id,
            volumeId: row.volume_id ?? null,
            title: row.title,
            isPaid: row.is_paid === 1,
            sortIndex: row.sort_index,
        }));
    } catch (err) {
        console.error('[Reader] getOfflineChapterList error:', err);
        return [];
    }
}

/**
 * Specific chapter content ဖတ်မယ် (sortIndex နဲ့)
 */
export async function getOfflineChapter(
    novelId: number,
    sortIndex: number
): Promise<OfflineChapter | null> {
    if (!isNativePlatform()) return null;

    const db = await getOfflineDb();
    if (!db) return null;

    try {
        const result = await db.query(
            `SELECT * FROM chapters_offline
       WHERE novel_id = ? AND sort_index = ?
       LIMIT 1`,
            [novelId, sortIndex]
        );

        if (!result.values || result.values.length === 0) return null;

        const row = result.values[0];
        return {
            id: row.id,
            novelId: row.novel_id,
            volumeId: row.volume_id ?? null,
            title: row.title,
            content: row.content,
            isPaid: row.is_paid === 1,
            sortIndex: row.sort_index,
        };
    } catch (err) {
        console.error('[Reader] getOfflineChapter error:', err);
        return null;
    }
}

/**
 * Previous / Next chapter ရဲ့ sortIndex ရယူမယ်
 */
export async function getAdjacentChapterIndexes(
    novelId: number,
    currentSortIndex: number
): Promise<{ prev: number | null; next: number | null }> {
    if (!isNativePlatform()) return { prev: null, next: null };

    const db = await getOfflineDb();
    if (!db) return { prev: null, next: null };

    try {
        const [prevRes, nextRes] = await Promise.all([
            db.query(
                `SELECT sort_index FROM chapters_offline
         WHERE novel_id = ? AND sort_index < ?
         ORDER BY sort_index DESC LIMIT 1`,
                [novelId, currentSortIndex]
            ),
            db.query(
                `SELECT sort_index FROM chapters_offline
         WHERE novel_id = ? AND sort_index > ?
         ORDER BY sort_index ASC LIMIT 1`,
                [novelId, currentSortIndex]
            ),
        ]);

        return {
            prev: prevRes.values?.[0]?.sort_index ?? null,
            next: nextRes.values?.[0]?.sort_index ?? null,
        };
    } catch (err) {
        console.error('[Reader] getAdjacentChapterIndexes error:', err);
        return { prev: null, next: null };
    }
}

/**
 * Offline volumes list ဖတ်မယ်
 */
export async function getOfflineVolumes(novelId: number): Promise<OfflineVolume[]> {
    if (!isNativePlatform()) return [];

    const db = await getOfflineDb();
    if (!db) return [];

    try {
        const result = await db.query(
            `SELECT * FROM volumes_offline WHERE novel_id = ? ORDER BY sort_index ASC`,
            [novelId]
        );

        return (result.values ?? []).map((row) => ({
            id: row.id,
            novelId: row.novel_id,
            name: row.name,
            sortIndex: row.sort_index,
        }));
    } catch (err) {
        console.error('[Reader] getOfflineVolumes error:', err);
        return [];
    }
}
