import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { getChapterForReader } from "@/lib/resources/chapters/queries";
import { checkChapterAccess } from "@/lib/resources/chapters/unlocks";

export const runtime = 'edge';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string; index: string }> }
) {
    try {
        const { slug, index } = await params;
        const { db, auth } = getServerContext({ withAuth: true });

        const result = await getChapterForReader(db, slug, index);
        if (!result || !result.chapter) {
            return NextResponse.json({ success: false, error: "Chapter not found" }, { status: 404 });
        }

        // Authenticate user if authorization header exists
        const session = await auth.api.getSession({ headers: request.headers });

        let isLocked = false;
        if (result.chapter.isPaid) {
            isLocked = true;
            if (session?.user) {
                const isOwner = session.user.id === result.novel.ownerId;
                if (isOwner) {
                    isLocked = false;
                } else {
                    const hasAccess = await checkChapterAccess(db, session.user.id, result.novel.id, result.chapter.id);
                    if (hasAccess) {
                        isLocked = false;
                    }
                }
            }
        }

        if (isLocked) {
            // Hide content from locked chapter response
            result.chapter.content = "";
        }

        return NextResponse.json({
            success: true,
            data: {
                ...result,
                isLocked
            }
        });
    } catch (error: any) {
        console.error("API /api/public/novel/[slug]/chapter/[index] error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
