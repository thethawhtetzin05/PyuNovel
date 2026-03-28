import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { updateChapter } from "@/lib/resources/chapters/mutations";
import { revalidatePath } from "next/cache";
import { ChapterSchema } from "@shared/schemas/chapter";

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

        const contentType = request.headers.get("content-type") || "";
        let data: any;

        if (contentType.includes("application/json")) {
            data = await request.json();
        } else {
            const formData = await request.formData() as any;
            const volumeIdRaw = formData.get('volumeId');
            const novelIdRaw = formData.get('novelId');
            const sortIndexRaw = formData.get('sortIndex');

            data = {
                chapterId: formData.get('chapterId') as string,
                novelSlug: formData.get('novelSlug') as string,
                novelId: novelIdRaw ? Number(novelIdRaw) : undefined,
                title: formData.get('title') as string,
                content: formData.get('content') as string,
                isPaid: formData.get('isPaid') === 'on' || formData.get('isPaid') === 'true',
                sortIndex: sortIndexRaw ? Number(sortIndexRaw) : undefined,
                volumeId: (volumeIdRaw && volumeIdRaw !== "") ? Number(volumeIdRaw) : null,
            };
        }

        const validation = ChapterSchema.safeParse(data);
        if (!validation.success) {
            return NextResponse.json({
                success: false,
                error: validation.error.issues[0].message
            }, { status: 400 });
        }

        const validatedData = validation.data;
        const chapterId = validatedData.chapterId;

        if (!chapterId) {
            return NextResponse.json({ success: false, error: "Missing chapterId" }, { status: 400 });
        }

        const updatedChapter = await updateChapter(db, chapterId, {
            title: validatedData.title,
            content: validatedData.content,
            isPaid: validatedData.isPaid,
            sortIndex: validatedData.sortIndex,
            volumeId: validatedData.volumeId || null,
            status: validatedData.status,
            publishedAt: validatedData.publishedAt,
            updatedAt: validatedData.updatedAt || new Date() // Use client-side timestamp if available for LWW
        }, session.user.id);

        let novelSlug = validatedData.novelSlug;
        if (!novelSlug) {
            const novel = await db.query.novels.findFirst({
                where: (novels, { eq }) => eq(novels.id, validatedData.novelId)
            });
            novelSlug = novel?.slug;
        }

        if (novelSlug) {
            revalidatePath(`/novel/${novelSlug}`);
        }
        return NextResponse.json({ success: true, sortIndex: validatedData.sortIndex, slug: novelSlug });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("Edit chapter API error:", String(error));
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
