import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { createChapter } from "@/lib/resources/chapters/mutations";
import { revalidatePath } from "next/cache";
import { ChapterSchema } from "@shared/schemas/chapter";
import { and } from "drizzle-orm";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { db, auth } = getServerContext();
        if (!auth) {
            return NextResponse.json({ success: false, error: "Auth not initialized" }, { status: 500 });
        }
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session) {
            return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
        }

        const body = await request.json();
        const validation = ChapterSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                success: false,
                error: validation.error.issues[0].message
            }, { status: 400 });
        }

        const data = validation.data;

        const novel = await db.query.novels.findFirst({
            where: (novels, { eq }) => eq(novels.id, data.novelId)
        });

        if (!novel || novel.ownerId !== session.user.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }

        let finalStatus = data.status;
        let finalPublishedAt = data.publishedAt;

        // Auto-Schedule Logic (Batch Posting at Selected Hour)
        if (novel.isScheduledMode) {
            const now = new Date();
            const scheduledHour = novel.scheduledHour || 18;
            const chaptersPerDay = novel.chaptersPerDay || 1;

            // Get all future scheduled chapters to find the next available slot
            const existingScheduled = await db.query.chapters.findMany({
                where: (chapters, { eq, and, gt }) => and(
                    eq(chapters.novelId, novel.id),
                    eq(chapters.status, 'scheduled'),
                    gt(chapters.publishedAt, now)
                )
            });

            // Calculate the slot: Index determines which day it lands on
            const slotIndex = existingScheduled.length;
            const daysAhead = Math.floor(slotIndex / chaptersPerDay);

            let targetDate = new Date(now);
            targetDate.setHours(scheduledHour, 0, 0, 0);

            // If the base scheduled hour for today has already passed, the 0th day is actually tomorrow
            if (targetDate <= now) {
                targetDate.setDate(targetDate.getDate() + 1);
            }

            // Offset by the number of days required by the current queue
            targetDate.setDate(targetDate.getDate() + daysAhead);
            finalPublishedAt = targetDate;
            finalStatus = 'scheduled';
        } else if (finalStatus === 'published' && !finalPublishedAt) {
            finalPublishedAt = new Date();
        }

        await createChapter(db, {
            novelId: data.novelId,
            volumeId: data.volumeId,
            title: data.title,
            content: data.content,
            sortIndex: data.sortIndex,
            isPaid: data.isPaid,
            status: finalStatus as any,
            publishedAt: finalPublishedAt
        }, session.user.id);

        revalidatePath(`/novel/${novel.slug}`);
        return NextResponse.json({ success: true, sortIndex: data.sortIndex });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("Create chapter API error:", String(error));
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
