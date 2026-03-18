import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { updateChapter } from "@/lib/resources/chapters/mutations";
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

        const contentType = request.headers.get("content-type") || "";
        let data: any;

        if (contentType.includes("application/json")) {
            data = await request.json();
        } else {
            const formData = await request.formData();
            data = {
                chapterId: formData.get('chapterId') as string,
                novelSlug: formData.get('novelSlug') as string,
                novelId: formData.get('novelId') ? Number(formData.get('novelId')) : undefined,
                title: formData.get('title') as string,
                content: formData.get('content') as string,
                isPaid: formData.get('isPaid') === 'on' || formData.get('isPaid') === 'true',
                sortIndex: formData.get('sortIndex') ? Number(formData.get('sortIndex')) : undefined,
                volumeId: formData.get('volumeId') ? Number(formData.get('volumeId')) : null,
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
