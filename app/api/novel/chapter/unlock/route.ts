import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { eq, sql } from "drizzle-orm";
import { chapterUnlocks, coinTransactions, user } from "@/db/schema";
import { revalidatePath } from "next/cache";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { db, auth } = getServerContext();
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { chapterId, novelId, chapterPrice, slug, sortIndex } = body;

        if (!chapterId || !novelId || !chapterPrice || !slug || !sortIndex) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const userId = session.user.id;

        // Need to fetch latest user info to get current coin balance
        const currentUser = await db.query.user.findFirst({
            where: eq(user.id, userId)
        });

        const userCoins = currentUser?.coins || 0;

        if (userCoins < chapterPrice) {
            return NextResponse.json({ success: false, error: "Insufficient coins" }, { status: 400 });
        }

        const deductCoinsQuery = db
            .update(user)
            .set({ coins: sql`${user.coins} - ${chapterPrice}` })
            .where(eq(user.id, userId));

        const uuid = globalThis.crypto.randomUUID();
        const createTxnQuery = db
            .insert(coinTransactions)
            .values({
                id: uuid,
                userId: userId,
                amount: chapterPrice,
                type: 'spend',
                status: 'success',
                reference: `chapter_unlock_${chapterId}`,
                createdAt: new Date(),
            });

        const createUnlockQuery = db
            .insert(chapterUnlocks)
            .values({
                userId: userId,
                chapterId: chapterId,
                coinsSpent: chapterPrice,
                unlockedAt: new Date(),
            });

        await db.batch([deductCoinsQuery, createTxnQuery, createUnlockQuery]);

        revalidatePath(`/novel/${slug}/${sortIndex}`);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("API unlock chapter error:", error);
        return NextResponse.json({
            success: false,
            error: error?.message || "Internal Server Error"
        }, { status: 500 });
    }
}
