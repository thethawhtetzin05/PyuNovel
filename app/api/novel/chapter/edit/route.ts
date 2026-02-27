import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { updateChapter } from "@/lib/resources/chapters/mutations";
import { revalidatePath } from "next/cache";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { db, auth } = getServerContext();
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session) {
            return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
        }

        const formData = await request.formData();
        const chapterId = formData.get('chapterId') as string;
        const novelSlug = formData.get('novelSlug') as string;
        const title = formData.get('title') as string;
        const content = formData.get('content') as string;
        const isPaid = formData.get('isPaid') === 'on';
        const sortIndexRaw = formData.get('sortIndex');
        const sortIndex = sortIndexRaw ? Number(sortIndexRaw) : undefined;
        const volumeIdRaw = formData.get('volumeId');
        const volumeId = volumeIdRaw ? Number(volumeIdRaw) : null;

        if (!chapterId || !novelSlug || !title || !content) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        await updateChapter(db, chapterId, {
            title,
            content,
            isPaid,
            sortIndex,
            volumeId,
            updatedAt: new Date()
        }, session.user.id);

        revalidatePath(`/novel/${novelSlug}`);
        return NextResponse.json({ success: true, sortIndex, slug: novelSlug });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("Edit chapter API error:", String(error));
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
