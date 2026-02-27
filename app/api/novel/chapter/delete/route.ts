import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { deleteChapter } from "@/lib/resources/chapters/mutations";
import { revalidatePath } from "next/cache";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { db, auth } = getServerContext();
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session) {
            return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
        }

        const { chapterId, novelSlug } = await request.json() as {
            chapterId: string | number;
            novelSlug: string;
        };

        if (!chapterId || !novelSlug) {
            return NextResponse.json({ success: false, error: "Missing required data" }, { status: 400 });
        }

        await deleteChapter(db, chapterId, session.user.id);

        revalidatePath(`/novel/${novelSlug}`);
        return NextResponse.json({ success: true });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("Delete chapter API error:", String(error));
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
