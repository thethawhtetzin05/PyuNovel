/**
 * lib/offline/db.ts
 * Capacitor SQLite connection helper
 * Web browser မှာ run ဆိုရင် null return မယ် (offline feature disable)
 */

import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { OFFLINE_DB_NAME, OFFLINE_DB_VERSION, ALL_TABLES } from './schema';

let _sqlite: SQLiteConnection | null = null;
let _db: SQLiteDBConnection | null = null;

/**
 * Native platform ဆိုမဆို စစ်ဆေးမယ်
 */
export function isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
}

/**
 * SQLite connection ရယူမယ်
 * Web browser မှာ ဆိုရင် null return မယ်
 */
async function getSQLiteConnection(): Promise<SQLiteConnection | null> {
    if (!isNativePlatform()) return null;
    if (_sqlite) return _sqlite;

    _sqlite = new SQLiteConnection(CapacitorSQLite);
    return _sqlite;
}

/**
 * Offline database ဖွင့်မယ် (encrypted)
 */
export async function getOfflineDb(): Promise<SQLiteDBConnection | null> {
    if (!isNativePlatform()) return null;
    if (_db) return _db;

    const sqlite = await getSQLiteConnection();
    if (!sqlite) return null;

    try {
        // Encrypted DB ဖွင့်မယ် — SQLCipher သုံးမယ်
        const ret = await sqlite.checkConnectionsConsistency();
        const isConn = (await sqlite.isConnection(OFFLINE_DB_NAME, false)).result;

        if (isConn) {
            _db = await sqlite.retrieveConnection(OFFLINE_DB_NAME, false);
        } else {
            _db = await sqlite.createConnection(
                OFFLINE_DB_NAME,
                true,            // encrypted
                'secret',        // mode: secret (passphrase protected)
                OFFLINE_DB_VERSION,
                false
            );
        }

        await _db.open();

        // Tables မရှိသေးရင် create လုပ်မယ်
        await initTables(_db);

        return _db;
    } catch (err) {
        console.error('[OfflineDB] Failed to open database:', err);
        return null;
    }
}

/**
 * Tables initialize လုပ်မယ်
 */
async function initTables(db: SQLiteDBConnection): Promise<void> {
    for (const sql of ALL_TABLES) {
        await db.execute(sql);
    }
}

/**
 * DB connection ပိတ်မယ်
 */
export async function closeOfflineDb(): Promise<void> {
    if (_db) {
        await _db.close();
        _db = null;
    }
}
