import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { chapters, novels } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const runtime = 'edge';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { db, auth } = getServerContext();
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

        const lastChapter = await db.query.chapters.findFirst({
            where: eq(chapters.novelId, novelId),
            orderBy: [desc(chapters.sortIndex)],
        });
        const startIndex = (lastChapter?.sortIndex ?? 0) + 1;

        // Get the absolute last ID to increment manually
        const lastIdRow = await db.select({ id: chapters.id }).from(chapters).orderBy(desc(chapters.id)).limit(1).get();
        let currentMaxId = lastIdRow?.id ?? 0;

        const rows = parsedChapters.map((ch, i) => ({
            id: currentMaxId + i + 1, 
            novelId,
            volumeId: volumeId || null, // 👈 Using OR operator
            title: ch.title,
            content: ch.content,
            isPaid: false,
            sortIndex: startIndex + i,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));

        const chunkSize = 50;
        for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);
            // Ensure all fields are explicitly mapped and null values are handled correctly for Drizzle
            await db.insert(chapters).values(
                chunk.map((row) => ({
                    id: row.id,
                    novelId: row.novelId,
                    volumeId: row.volumeId || null,
                    title: row.title,
                    content: row.content,
                    isPaid: false,
                    sortIndex: row.sortIndex,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                }))
            );
        }

        revalidatePath(`/novel/${slug}`);
        return NextResponse.json({ success: true, count: parsedChapters.length });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("Bulk upload API error:", String(error));
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
