import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

const DB_NAME = 'pyunovel_offline_db';

let sqliteConnection: SQLiteConnection | null = null;
let db: SQLiteDBConnection | null = null;

export const initMobileDB = async () => {
    if (!Capacitor.isNativePlatform()) return; // ဝဘ်ဆိုက်ဆိုရင် မလုပ်ဘူး
    if (db) return db;

    try {
        sqliteConnection = new SQLiteConnection(CapacitorSQLite);
        const ret = await sqliteConnection.checkConnectionsConsistency();
        const isConn = (await sqliteConnection.isConnection(DB_NAME, false)).result;

        if (ret.result && isConn) {
            db = await sqliteConnection.retrieveConnection(DB_NAME, false);
        } else {
            db = await sqliteConnection.createConnection(DB_NAME, false, "no-encryption", 1, false);
        }

        await db.open();

        // Table ဆောက်မယ် (မရှိသေးရင်)
        const schema = `
            CREATE TABLE IF NOT EXISTS offline_chapters (
                id TEXT PRIMARY KEY,
                novel_id INTEGER NOT NULL,
                novel_title TEXT,
                title TEXT,
                content TEXT,
                prev_chapter_id TEXT,
                next_chapter_id TEXT,
                saved_at INTEGER
            );
            CREATE INDEX IF NOT EXISTS idx_novel_id ON offline_chapters(novel_id);
        `;
        await db.execute(schema);
        console.log("📱 Mobile DB Initialized");
        return db;
    } catch (e) {
        console.error("Failed to init mobile DB", e);
        return null;
    }
};

export const saveChapterOffline = async (chapter: any, novelTitle: string) => {
    if (!db) await initMobileDB();
    if (!db) return;

    try {
        const query = `
            INSERT OR REPLACE INTO offline_chapters 
            (id, novel_id, novel_title, title, content, prev_chapter_id, next_chapter_id, saved_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.run(query, [
            chapter.id.toString(),
            chapter.novelId,
            novelTitle,
            chapter.title,
            chapter.content,
            chapter.prevChapterId ? chapter.prevChapterId.toString() : null,
            chapter.nextChapterId ? chapter.nextChapterId.toString() : null,
            Date.now()
        ]);
        console.log(`💾 Saved offline: ${chapter.title}`);
    } catch (e) {
        console.error("Failed to save chapter offline", e);
    }
};

export const getChapterOffline = async (chapterId: string) => {
    if (!db) await initMobileDB();
    if (!db) return null;

    try {
        const result = await db.query(`SELECT * FROM offline_chapters WHERE id = ?`, [chapterId]);
        if (result.values && result.values.length > 0) {
            console.log(`📂 Loaded from offline: ${chapterId}`);
            return result.values[0];
        }
    } catch (e) {
        console.error("Failed to get offline chapter", e);
    }
    return null;
};
