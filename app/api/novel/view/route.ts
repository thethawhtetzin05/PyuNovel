import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { eq, sql } from "drizzle-orm";
import { novels } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { db } = getServerContext({ withAuth: false });

        const body = await request.json() as { slug?: string; chapterId?: string };
        const slug = body?.slug;
        const chapterId = body?.chapterId || "default";

        if (!slug || typeof slug !== 'string') {
            return NextResponse.json({ success: false, error: "slug မပါဘူး" }, { status: 400 });
        }

        // Rate Limiting: 1 view per chapter per hour per IP
        const ip = request.headers.get("cf-connecting-ip") || "anonymous";
        const isLocal = ip === "127.0.0.1" || ip === "::1" || ip === "anonymous" || process.env.NODE_ENV !== "production";

        const limitKey = `view:${slug}:${chapterId}:${ip}`;
        let allowed = true;
        let remaining = 1;
        let resetAt = new Date();

        if (!isLocal) {
            const result = await rateLimit(db, limitKey, 1, 3600);
            allowed = result.success;
            remaining = result.remaining;
            resetAt = result.resetAt;
        }

        if (!allowed) {
            return NextResponse.json({
                success: false,
                error: "Rate limit exceeded (1 view per chapter/hour)",
                resetAt
            }, {
                status: 429,
                headers: {
                    "Retry-After": Math.ceil((resetAt.getTime() - Date.now()) / 1000).toString()
                }
            });
        }

        await db.update(novels)
            .set({
                views: sql`COALESCE(${novels.views}, 0) + 1`
            })
            .where(eq(novels.slug, slug))
            .run();

        revalidatePath(`/novel/${slug}`);
        // revalidatePath(`/[locale]/novel/${slug}`, 'page');

        return NextResponse.json({ success: true, remaining });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("[VIEW API] Failed:", String(error));
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
