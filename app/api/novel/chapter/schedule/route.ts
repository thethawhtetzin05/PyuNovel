import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { chapters, novels } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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

        const { chapterIds, scheduledHour, chaptersPerDay, novelSlug } = await request.json() as {
            chapterIds: number[];
            scheduledHour: number;
            chaptersPerDay: number;
            novelSlug: string;
        };

        if (!chapterIds || chapterIds.length === 0 || !novelSlug) {
            return NextResponse.json({ success: false, error: "Missing required data" }, { status: 400 });
        }

        // Verify novel ownership
        const novel = await db.query.novels.findFirst({
            where: (n, { eq, and }) => and(eq(n.slug, novelSlug), eq(n.ownerId, session.user.id)),
        });

        if (!novel) {
            return NextResponse.json({ success: false, error: "Novel not found or unauthorized" }, { status: 404 });
        }

        const now = new Date();
        const mmOffset = 6.5 * 60 * 60 * 1000;
        const nowMM = new Date(now.getTime() + mmOffset);

        // Process each chapter sequentially to assign slots
        // We assume the caller sends them in the desired order
        for (let i = 0; i < chapterIds.length; i++) {
            const id = chapterIds[i];

            const daysAhead = Math.floor(i / chaptersPerDay);
            let targetDateMM = new Date(nowMM);
            targetDateMM.setUTCHours(scheduledHour, 0, 0, 0);

            // If the base scheduled hour for today has already passed in Myanmar, start from tomorrow
            if (targetDateMM <= nowMM) {
                targetDateMM.setUTCDate(targetDateMM.getUTCDate() + 1);
            }

            // Offset by the number of days required by the queue position
            targetDateMM.setUTCDate(targetDateMM.getUTCDate() + daysAhead);

            const publishedAt = new Date(targetDateMM.getTime() - mmOffset);

            await db.update(chapters)
                .set({
                    status: 'scheduled',
                    publishedAt: publishedAt,
                    updatedAt: new Date()
                })
                .where(and(eq(chapters.id, id), eq(chapters.novelId, novel.id)))
                .run();
        }

        revalidatePath(`/novel/${novelSlug}`);
        return NextResponse.json({ success: true });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("Batch schedule API error:", String(error));
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
