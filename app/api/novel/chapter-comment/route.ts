import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { createAuth } from "@/lib/auth";
import { createChapterComment, voteOnComment } from "@/lib/resources/chapter-comments/mutations";
import { getChapterComments, getParagraphCommentCounts } from "@/lib/resources/chapter-comments/queries";
import { z } from "zod";

export const runtime = 'edge';

const commentSchema = z.object({
    chapterId: z.coerce.number(),
    paragraphIndex: z.coerce.number().optional().nullable(),
    content: z.string().min(1, "Comment cannot be empty").optional(),
    parentCommentId: z.coerce.number().optional().nullable(),
    vote: z.number().optional(), // 1 or -1
    commentId: z.number().optional() // For voting/deleting
});

export async function GET(request: NextRequest) {
    try {
        const { env } = getRequestContext();
        const db = drizzle(env.DB, { schema });
        const { searchParams } = new URL(request.url);
        const chapterId = searchParams.get("chapterId");
        const mode = searchParams.get("mode"); // "counts" or "list"

        if (!chapterId) {
            return NextResponse.json({ success: false, error: "Chapter ID is required" }, { status: 400 });
        }

        if (mode === "counts") {
            const counts = await getParagraphCommentCounts(db, parseInt(chapterId));
            return NextResponse.json({ success: true, data: counts });
        }

        const comments = await getChapterComments(db, parseInt(chapterId));
        return NextResponse.json({ success: true, data: comments });

    } catch (error: any) {
        console.error("Fetch comments API error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { env } = getRequestContext();
        const db = drizzle(env.DB, { schema });

        const auth = createAuth(env.DB);
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session) {
            return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
        }

        const body = await request.json();
        const validation = commentSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                success: false,
                error: validation.error.issues[0].message
            }, { status: 400 });
        }

        const data = validation.data;

        // Voting logic
        if (data.commentId && data.vote !== undefined) {
            const voteResult = await voteOnComment(db, data.commentId, session.user.id, data.vote);
            return NextResponse.json({ success: true, data: voteResult });
        }

        // Comment/Reply logic
        if (data.content) {
            const result = await createChapterComment(db, {
                chapterId: data.chapterId,
                paragraphIndex: data.paragraphIndex,
                content: data.content,
                parentCommentId: data.parentCommentId
            }, session.user.id);

            return NextResponse.json({ success: true, data: result[0] });
        }

        return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });

    } catch (error: any) {
        console.error("Comment API error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
