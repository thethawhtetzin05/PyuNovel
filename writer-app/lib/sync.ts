import { getDB } from "./db";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = "https://pyunovel.pages.dev"; // Or your production URL

export async function processSyncQueue() {
    const db = await getDB();
    const token = await SecureStore.getItemAsync("auth_token");

    if (!token) return;

    // Only select items that are due for retry
    const queue = await db.getAllAsync<{
        id: number;
        action: string;
        recordId: string;
        payload: string;
        attempts: number;
    }>("SELECT * FROM sync_queue WHERE nextAttemptAt IS NULL OR nextAttemptAt <= CURRENT_TIMESTAMP ORDER BY createdAt ASC");

    for (const item of queue) {
        try {
            const payload = JSON.parse(item.payload);
            let response;

            if (item.action === "create_chapter") {
                response = await axios.post(`${API_URL}/api/novel/chapter/create`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else if (item.action === "update_chapter") {
                // Ensure payload has chapterId (which is the recordId on the server)
                const syncPayload = { ...payload, chapterId: item.recordId };
                response = await axios.post(`${API_URL}/api/novel/chapter/edit`, syncPayload, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });
            } else if (item.action === "create_novel") {
                response = await axios.post(`${API_URL}/api/novel/create`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            if (response?.data?.success) {
                // Success! Remove from queue and update draft status
                await db.runAsync("DELETE FROM sync_queue WHERE id = ?", [item.id]);
                const tableName = item.action === "create_novel" ? "draft_novels" : "draft_chapters";
                await db.runAsync(`UPDATE ${tableName} SET status = 'synced', serverUpdatedAt = CURRENT_TIMESTAMP WHERE id = ?`, [item.recordId]);
            } else {
                throw new Error(response?.data?.error || "Unknown server error");
            }
        } catch (error: any) {
            console.error("Sync error for item", item.id, error?.message);
            
            const nextAttempts = item.attempts + 1;
            // Exponential backoff: 5 * 2^attempts minutes (5, 10, 20, 40, 80...)
            const delayMinutes = Math.min(5 * Math.pow(2, nextAttempts), 1440); // Cap at 24 hours
            
            await db.runAsync(
                "UPDATE sync_queue SET attempts = ?, lastError = ?, nextAttemptAt = datetime('now', '+' || ? || ' minutes') WHERE id = ?",
                [nextAttempts, error?.message, delayMinutes, item.id]
            );
        }
    }
}

export async function addToSyncQueue(action: string, tableName: string, recordId: string, payload: any) {
    const db = await getDB();
    
    // Check if there's already a pending sync for this record
    const existing = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM sync_queue WHERE recordId = ? AND action = ? LIMIT 1",
        [recordId, action]
    );

    if (existing) {
        await db.runAsync(
            "UPDATE sync_queue SET payload = ?, createdAt = CURRENT_TIMESTAMP, attempts = 0, nextAttemptAt = NULL WHERE id = ?",
            [JSON.stringify(payload), existing.id]
        );
    } else {
        await db.runAsync(
            "INSERT INTO sync_queue (action, tableName, recordId, payload) VALUES (?, ?, ?, ?)",
            [action, tableName, recordId, JSON.stringify(payload)]
        );
    }
}
