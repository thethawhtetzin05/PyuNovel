import * as SQLite from "expo-sqlite";

export const dbId = "writer.db";

export async function initDatabase() {
    const db = await SQLite.openDatabaseAsync(dbId);

    // Create table for local drafts
    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS draft_chapters (
      id TEXT PRIMARY KEY,
      novelId INTEGER NOT NULL,
      volumeId INTEGER,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      isPaid INTEGER DEFAULT 0,
      sortIndex INTEGER NOT NULL,
      status TEXT DEFAULT 'draft', -- 'draft', 'syncing', 'synced'
      localUpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      serverUpdatedAt DATETIME
    );

    CREATE TABLE IF NOT EXISTS draft_novels (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      englishTitle TEXT NOT NULL,
      author TEXT,
      description TEXT,
      tags TEXT,
      status TEXT DEFAULT 'draft', -- 'draft', 'syncing', 'synced'
      localUpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      serverUpdatedAt DATETIME
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL, -- 'create_chapter', 'update_chapter', 'delete_chapter'
      tableName TEXT NOT NULL,
      recordId TEXT NOT NULL,
      payload TEXT,
      attempts INTEGER DEFAULT 0,
      lastError TEXT,
      nextAttemptAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

    return db;
}

export const getDB = async () => {
    return await SQLite.openDatabaseAsync(dbId);
};
