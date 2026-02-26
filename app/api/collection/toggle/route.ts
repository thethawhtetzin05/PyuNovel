import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createAuth } from "@/lib/auth";
import { drizzle } from "drizzle-orm/d1";
import { isNovelCollected } from "@/lib/resources/collections/queries";
import {
    addToCollection,
    removeFromCollection
} from "@/lib/resources/collections/mutations";
import { revalidatePath } from "next/cache";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { novelId, pathToRevalidate } = await request.json() as {
            novelId: number;
            pathToRevalidate?: string;
        };

        if (!novelId) {
            return NextResponse.json({ success: false, error: "Missing novelId" }, { status: 400 });
        }

        const { env } = getRequestContext();
        const auth = createAuth(env.DB);
        const session = await auth.api.getSession({
            headers: request.headers
        });

        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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

        if (pathToRevalidate) {
            revalidatePath(pathToRevalidate);
        }
        revalidatePath('/collection');

        return NextResponse.json({
            success: true,
            isCollected: !isCollected
        });

    } catch (error: any) {
        console.error("API toggle collection error:", error);
        return NextResponse.json({
            success: false,
            error: error?.message || "Internal Server Error"
        }, { status: 500 });
    }
}
