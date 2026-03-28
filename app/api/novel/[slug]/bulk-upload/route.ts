import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { chapters, novels } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const runtime = 'edge';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { db, auth } = getServerContext();
        if (!auth) {
            return NextResponse.json({ success: false, error: "Auth not initialized" }, { status: 500 });
        }
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session) {
            return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
        }

        const { slug } = await params;
        const { novelId, volumeId, chapters: parsedChapters } = await request.json() as {
            novelId: number;
            volumeId?: number | null;
            chapters: { title: string; content: string }[];
        };

        if (!novelId || !parsedChapters || parsedChapters.length === 0) {
            return NextResponse.json({ success: false, error: "Missing required data" }, { status: 400 });
        }

        const novel = await db.query.novels.findFirst({
            where: (n, { eq, and }) => and(eq(n.id, novelId), eq(n.ownerId, session.user.id)),
        });

        if (!novel) {
            return NextResponse.json({ success: false, error: "Novel not found or unauthorized" }, { status: 404 });
        }

        // Calculate start index and next ID
        const lastChapter = await db.query.chapters.findFirst({
            where: eq(chapters.novelId, novelId),
            orderBy: [desc(chapters.sortIndex)],
        });
        const startIndex = (lastChapter?.sortIndex ?? 0) + 1;

        const lastIdRow = await db.select({ id: chapters.id }).from(chapters).orderBy(desc(chapters.id)).limit(1).get();
        let currentMaxId = lastIdRow?.id ?? 0;

        // Calculate scheduling slots if mode is enabled
        let currentScheduledCount = 0;
        const now = new Date();
        const mmOffset = 6.5 * 60 * 60 * 1000;
        const nowMM = new Date(now.getTime() + mmOffset);

        if (novel.isScheduledMode) {
            const existingScheduled = await db.query.chapters.findMany({
                where: (chapters, { eq, and, gt }) => and(
                    eq(chapters.novelId, novel.id),
                    eq(chapters.status, 'scheduled'),
                    gt(chapters.publishedAt, now)
                )
            });
            currentScheduledCount = existingScheduled.length;
        }

        const rows = parsedChapters.map((ch, i) => {
            let status = 'published';
            let publishedAt = new Date();

            if (novel.isScheduledMode) {
                const scheduledHour = novel.scheduledHour || 18;
                const chaptersPerDay = novel.chaptersPerDay || 1;

                // Virtual slot index for this specific chapter in the batch
                const slotIndex = currentScheduledCount + i;
                const daysAhead = Math.floor(slotIndex / chaptersPerDay);

                // Create target date in Myanmar time
                let targetDateMM = new Date(nowMM);
                targetDateMM.setUTCHours(scheduledHour, 0, 0, 0);

                // If the base scheduled hour for today has already passed in Myanmar, start from tomorrow
                if (targetDateMM <= nowMM) {
                    targetDateMM.setUTCDate(targetDateMM.getUTCDate() + 1);
                }

                // Offset by the number of days required by the queue position
                targetDateMM.setUTCDate(targetDateMM.getUTCDate() + daysAhead);

                status = 'scheduled';
                // Convert back to UTC for storage
                publishedAt = new Date(targetDateMM.getTime() - mmOffset);
            }

            return {
                id: currentMaxId + i + 1,
                novelId,
                volumeId: volumeId || null,
                title: ch.title,
                content: ch.content,
                isPaid: false,
                status: status as any,
                publishedAt: publishedAt,
                sortIndex: startIndex + i,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        });

        // Batch insert in chunks
        const chunkSize = 25;
        for (let i = 0; i < rows.length; i += chunkSize) {
            await db.insert(chapters).values(rows.slice(i, i + chunkSize));
        }

        revalidatePath(`/novel/${slug}`);
        return NextResponse.json({ success: true, count: parsedChapters.length });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("Bulk upload API error:", String(error));
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
