import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { chapters } from "@/db/schema";
import { and, eq, lte, sql } from "drizzle-orm";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * Cron Publish API
 * Triggered by: Cloudflare Cron or external scheduler
 * Security: Requires ADMIN_SECRET_KEY
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get("x-admin-secret");
        const { db } = getServerContext();

        // simple security check
        if (authHeader !== process.env.ADMIN_SECRET_KEY) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        // 1. Find all scheduled chapters that are due for publishing
        const chaptersToPublish = await db
            .select({ id: chapters.id })
            .from(chapters)
            .where(
                and(
                    eq(chapters.status, 'scheduled'),
                    lte(chapters.publishedAt, new Date())
                )
            )
            .all();

        if (chaptersToPublish.length === 0) {
            return NextResponse.json({ success: true, message: "No chapters to publish" });
        }

        // 2. Update them to 'published'
        const chapterIds = chaptersToPublish.map(c => c.id);
        await db
            .update(chapters)
            .set({ status: 'published' })
            .where(sql`${chapters.id} IN (${sql.join(chapterIds, sql`, `)})`)
            .run();

        return NextResponse.json({
            success: true,
            message: `Published ${chapterIds.length} chapters`,
            ids: chapterIds
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("Cron Publish Error:", String(error));
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
