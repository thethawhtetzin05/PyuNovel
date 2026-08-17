import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { eq, sql } from "drizzle-orm";
import { chapterUnlocks, coinTransactions, user, session as sessionTable } from "@/db/schema";
import { checkChapterAccess } from "@/lib/resources/chapters/unlocks";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const runtime = 'edge';

const unlockSchema = z.object({
    chapterId: z.coerce.number(),
    novelId: z.coerce.number(),
    chapterPrice: z.coerce.number(),
    slug: z.string(),
    sortIndex: z.coerce.number(),
});

export async function POST(request: NextRequest) {
    try {
        const { db, auth } = getServerContext();
        let session = auth ? await auth.api.getSession({ headers: request.headers }) : null;

        // Fallback for mobile apps passing Bearer token directly
        let userId = session?.user?.id;
        if (!userId) {
            const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
            if (authHeader && authHeader.startsWith("Bearer ")) {
                const bearerToken = authHeader.substring(7).trim();
                const foundSession = await db.query.session.findFirst({
                    where: eq(sessionTable.token, bearerToken)
                });
                if (foundSession?.userId) {
                    userId = foundSession.userId;
                }
            }
        }

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validation = unlockSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ success: false, error: validation.error.message }, { status: 400 });
        }
        const { chapterId, novelId, chapterPrice, slug, sortIndex } = validation.data;

        // Check if chapter is already unlocked or accessible
        const hasAccess = await checkChapterAccess(db, userId, novelId, chapterId);
        if (hasAccess) {
            return NextResponse.json({ success: true, message: "Already unlocked" });
        }

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
