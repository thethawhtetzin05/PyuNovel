"use server";

import { getRequestContext } from "@cloudflare/next-on-pages";
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { drizzle } from "drizzle-orm/d1";
import { revalidatePath } from "next/cache";

import {
    addToCollection,
    removeFromCollection,
    updateReadingProgress
} from "@/lib/resources/collections/mutations";
import { isNovelCollected } from "@/lib/resources/collections/queries";

export async function toggleCollectionAction(novelId: number, pathToRevalidate: string) {
    try {
        const { env } = getRequestContext();
        const auth = createAuth(env.DB);
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const db = drizzle(env.DB);
        const userId = session.user.id;

        // Check if already collected
        const isCollected = await isNovelCollected(db, userId, novelId);

        if (isCollected) {
            await removeFromCollection(db, userId, novelId);
        } else {
            await addToCollection(db, userId, novelId);
        }

        revalidatePath(pathToRevalidate);
        revalidatePath('/collection');
        return { success: true, isCollected: !isCollected };
    } catch (error: any) {
        console.error("Toggle collection error details:", {
            error: error?.message || error,
            novelId,
            pathToRevalidate
        });
        return { success: false, error: "Failed to update collection. Please try again later." };
    }
}

export async function saveReadingProgressAction(novelId: number, chapterId: number) {
    try {
        const { env } = getRequestContext();
        const auth = createAuth(env.DB);
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const db = drizzle(env.DB);
        const userId = session.user.id;

        await updateReadingProgress(db, userId, novelId, chapterId);
        return { success: true };
    } catch (error) {
        console.error("Save reading progress error:", error);
        return { success: false, error: "Failed to save progress" };
    }
}
