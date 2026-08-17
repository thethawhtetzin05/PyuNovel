import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { getNovelBySlug } from "@/lib/resources/novels/queries";
import { getVolumesByNovelId } from "@/lib/resources/volumes/queries";
import { getPaginatedChaptersByNovelId, getChaptersCountByNovelId } from "@/lib/resources/chapters/queries";
import { chapterUnlocks, session as sessionTable } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export const runtime = 'edge';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const { db } = getServerContext({ withAuth: false });

        const novel = await getNovelBySlug(db, slug);
        if (!novel) {
            return NextResponse.json({ success: false, error: "Novel not found" }, { status: 404 });
        }

        const [volumes, chapters, totalChapters] = await Promise.all([
            getVolumesByNovelId(db, novel.id),
            getPaginatedChaptersByNovelId(db, novel.id, { limit: 50, offset: 0 }),
            getChaptersCountByNovelId(db, novel.id),
        ]);

        // Check if user is logged in to check unlocked chapters
        let userId: string | undefined = undefined;
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

        let unlockedSet = new Set<number>();
        if (userId && chapters.length > 0) {
            const chapterIds = chapters.map(ch => ch.id);
            const unlockedList = await db.select({ chapterId: chapterUnlocks.chapterId })
                .from(chapterUnlocks)
                .where(and(
                    eq(chapterUnlocks.userId, userId),
                    inArray(chapterUnlocks.chapterId, chapterIds)
                ))
                .all();
            unlockedSet = new Set(unlockedList.map(u => u.chapterId));
        }

        const chaptersWithUnlockStatus = chapters.map(ch => ({
            ...ch,
            isUnlocked: unlockedSet.has(ch.id)
        }));

        return NextResponse.json({
            success: true,
            novel,
            volumes,
            chapters: chaptersWithUnlockStatus,
            totalChapters,
        });
    } catch (error: any) {
        console.error("API /api/public/novel/[slug] error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
