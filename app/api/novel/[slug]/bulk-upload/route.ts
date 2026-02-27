import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { chapters } from "@/db/schema";
import { eq, max } from "drizzle-orm";
import { createAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const runtime = 'edge';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const { novelId, volumeId, chapters: parsedChapters } = await request.json() as {
            novelId: number;
            volumeId?: number | null;
            chapters: { title: string; content: string }[];
        };

        if (!novelId || !parsedChapters || parsedChapters.length === 0) {
            return NextResponse.json({ success: false, error: "Missing required data" }, { status: 400 });
        }

        const { env } = getRequestContext();
        const db = drizzle(env.DB, { schema });

        const auth = createAuth(env.DB);
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session) {
            return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
        }

        const novel = await db.query.novels.findFirst({
            where: (n, { eq, and }) => and(eq(n.id, novelId), eq(n.ownerId, session.user.id)),
        });

        if (!novel) {
            return NextResponse.json({ success: false, error: "Novel not found or unauthorized" }, { status: 404 });
        }

        // Get last sortIndex
        const lastIndexRow = await db
            .select({ val: max(chapters.sortIndex) })
            .from(chapters)
            .where(eq(chapters.novelId, novelId))
            .get();
        const startIndex = (lastIndexRow?.val ?? 0) + 1;

        // Batch Insert with Chunking
        const rows = parsedChapters.map((ch, i) => ({
            novelId,
            volumeId: volumeId || null,
            title: ch.title,
            content: ch.content,
            sortIndex: startIndex + i,
            isPaid: false,
            createdAt: new Date(),
        }));

        const chunkSize = 50;
        for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);
            await db.insert(chapters).values(chunk);
        }

        revalidatePath(`/novel/${slug}`);
        return NextResponse.json({ success: true, count: parsedChapters.length });

    } catch (error: any) {
        console.error("Bulk upload API error:", error);
        return NextResponse.json({
            success: false,
            error: error?.message || "Internal Server Error"
        }, { status: 500 });
    }
}
