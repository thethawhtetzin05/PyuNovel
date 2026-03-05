import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { eq, sql } from "drizzle-orm";
import { novels } from "@/db/schema";
import { revalidatePath } from "next/cache";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { db } = getServerContext();

        const body = await request.json() as { slug?: string };
        const slug = body?.slug;

        if (!slug || typeof slug !== 'string') {
            return NextResponse.json({ success: false, error: "slug မပါဘူး" }, { status: 400 });
        }

        await db.update(novels)
            .set({
                views: sql`COALESCE(${novels.views}, 0) + 1`
            })
            .where(eq(novels.slug, slug))
            .run();

        revalidatePath(`/novel/${slug}`);
        revalidatePath(`/[locale]/novel/${slug}`, 'page');

        console.log(`[VIEW API] Incremented view for: ${slug}`);
        return NextResponse.json({ success: true });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("[VIEW API] Failed:", String(error));
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
