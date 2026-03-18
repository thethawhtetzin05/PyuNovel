import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { createChapter } from "@/lib/resources/chapters/mutations";
import { revalidatePath } from "next/cache";
import { ChapterSchema } from "@shared/schemas/chapter";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { db, auth } = getServerContext();
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

        await createChapter(db, {
            novelId: data.novelId,
            volumeId: data.volumeId,
            title: data.title,
            content: data.content,
            sortIndex: data.sortIndex,
            isPaid: data.isPaid,
        }, session.user.id);

        revalidatePath(`/novel/${novel.slug}`);
        return NextResponse.json({ success: true, sortIndex: data.sortIndex });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("Create chapter API error:", String(error));
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
