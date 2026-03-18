import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { eq, sum, sql } from "drizzle-orm";
import { novels, chapterUnlocks, gifts, chapters } from "@/db/schema";

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    try {
        const { db, auth } = getServerContext();
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // 1. Get all novels owned by the user
        const authorNovels = await db
            .select({ id: novels.id, title: novels.title, views: novels.views })
            .from(novels)
            .where(eq(novels.ownerId, userId));

        const novelIds = authorNovels.map(n => n.id);

        if (novelIds.length === 0) {
            return NextResponse.json({
                success: true,
                data: { totalViews: 0, totalEarnings: 0, novels: [] }
            });
        }

        // 2. Aggregate earnings from chapter unlocks for these novels
        const unlockEarnings = await db
            .select({
                novelId: chapters.novelId,
                total: sum(chapterUnlocks.coinsSpent)
            })
            .from(chapterUnlocks)
            .innerJoin(chapters, eq(chapterUnlocks.chapterId, chapters.id))
            .where(sql`${chapters.novelId} IN ${novelIds}`)
            .groupBy(chapters.novelId);

        // 3. Aggregate earnings from gifts for these novels
        const giftEarnings = await db
            .select({
                novelId: gifts.novelId,
                total: sum(gifts.coinsSpent)
            })
            .from(gifts)
            .where(sql`${gifts.novelId} IN ${novelIds}`)
            .groupBy(gifts.novelId);

        // 4. Combine data
        const analytics = authorNovels.map(novel => {
            const unlockTotal = Number(unlockEarnings.find(e => e.novelId === novel.id)?.total || 0);
            const giftTotal = Number(giftEarnings.find(e => e.novelId === novel.id)?.total || 0);
            return {
                id: novel.id,
                title: novel.title,
                views: novel.views,
                earnings: unlockTotal + giftTotal
            };
        });

        const totalViews = analytics.reduce((acc, curr) => acc + curr.views, 0);
        const totalEarnings = analytics.reduce((acc, curr) => acc + curr.earnings, 0);

        return NextResponse.json({
            success: true,
            data: {
                totalViews,
                totalEarnings,
                novels: analytics
            }
        });

    } catch (error: any) {
        console.error("API get author analytics error:", error);
        return NextResponse.json({
            success: false,
            error: error?.message || "Internal Server Error"
        }, { status: 500 });
    }
}
