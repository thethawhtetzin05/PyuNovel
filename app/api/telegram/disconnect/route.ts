import { NextRequest, NextResponse } from "next/server";
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { revalidatePath } from "next/cache";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const env = getRequestContext().env;
        const db = getDb(env.DB);

        const auth = createAuth(env.DB);
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Remove all telegram data for the currently logged in user
        await db.update(user)
            .set({ 
                telegramId: null, 
                telegramName: null, 
                telegramUsername: null, 
                updatedAt: new Date() 
            })
            .where(eq(user.id, session.user.id))
            .run();

        revalidatePath('/', 'layout'); // Clear the Next.js cache so the profile updates instantly!

        return new NextResponse("Successfully disconnected", { status: 200 });
    } catch (error) {
        console.error("[TELEGRAM_DISCONNECT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}