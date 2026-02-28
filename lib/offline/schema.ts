/**
 * lib/offline/schema.ts
 * Device ထဲမှာ save မယ့် local SQLite tables ရဲ့ SQL definitions
 */

export const OFFLINE_DB_NAME = 'pyunovel_offline';
export const OFFLINE_DB_VERSION = 1;

// Novel table — novel metadata သိမ်းမယ်
export const CREATE_NOVELS_TABLE = `
  CREATE TABLE IF NOT EXISTS novels_offline (
    id          INTEGER PRIMARY KEY,
    slug        TEXT    NOT NULL UNIQUE,
    title       TEXT    NOT NULL,
    english_title TEXT  NOT NULL,
    author      TEXT    NOT NULL,
    description TEXT,
    cover_url   TEXT,
    tags        TEXT    NOT NULL DEFAULT '',
    status      TEXT    NOT NULL DEFAULT 'ongoing',
    views       INTEGER NOT NULL DEFAULT 0,
    downloaded_at INTEGER NOT NULL
  );
`;

// Volume table — novel ရဲ့ volume list သိမ်းမယ်
export const CREATE_VOLUMES_TABLE = `
  CREATE TABLE IF NOT EXISTS volumes_offline (
    id          INTEGER PRIMARY KEY,
    novel_id    INTEGER NOT NULL,
    name        TEXT    NOT NULL,
    sort_index  REAL    NOT NULL,
    FOREIGN KEY (novel_id) REFERENCES novels_offline(id) ON DELETE CASCADE
  );
`;

// Chapter table — chapter content သိမ်းမယ်
export const CREATE_CHAPTERS_TABLE = `
  CREATE TABLE IF NOT EXISTS chapters_offline (
    id          INTEGER PRIMARY KEY,
    novel_id    INTEGER NOT NULL,
    volume_id   INTEGER,
    title       TEXT    NOT NULL,
    content     TEXT    NOT NULL,
    is_paid     INTEGER NOT NULL DEFAULT 0,
    sort_index  REAL    NOT NULL,
    FOREIGN KEY (novel_id) REFERENCES novels_offline(id) ON DELETE CASCADE
  );
`;

export const ALL_TABLES = [
    CREATE_NOVELS_TABLE,
    CREATE_VOLUMES_TABLE,
    CREATE_CHAPTERS_TABLE,
];
