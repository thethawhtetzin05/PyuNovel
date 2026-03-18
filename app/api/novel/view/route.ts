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

        const body = await request.json() as { slug?: string };
        const slug = body?.slug;

        if (!slug || typeof slug !== 'string') {
            return NextResponse.json({ success: false, error: "slug မပါဘူး" }, { status: 400 });
        }

        // Rate Limiting: 10 views per hour per IP/Slug combination
        const ip = request.headers.get("cf-connecting-ip") || "anonymous";
        const limitKey = `view:${slug}:${ip}`;
        const { success, remaining, resetAt } = await rateLimit(db, limitKey, 10, 3600);

        if (!success) {
            return NextResponse.json({ 
                success: false, 
                error: "Rate limit exceeded",
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
