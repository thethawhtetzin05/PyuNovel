import { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function createChapterComment(
    db: any,
    data: {
        chapterId: number;
        paragraphIndex?: number | null;
        content: string;
        parentCommentId?: number | null;
    },
    userId: string
) {
    return await db.insert(schema.chapterComments).values({
        chapterId: data.chapterId,
        paragraphIndex: data.paragraphIndex,
        content: data.content,
        parentCommentId: data.parentCommentId,
        userId: userId,
    }).returning();
}

export async function voteOnComment(db: any, commentId: number, userId: string, vote: number) {
    // Upsert vote
    return await db.insert(schema.chapterCommentVotes).values({
        commentId,
        userId,
        vote,
    }).onConflictDoUpdate({
        target: [schema.chapterCommentVotes.commentId, schema.chapterCommentVotes.userId],
        set: { vote },
    });
}


export async function deleteChapterComment(db: any, commentId: number, userId: string) {
    return await db.delete(schema.chapterComments)
        .where(
            and(
                eq(schema.chapterComments.id, commentId),
                eq(schema.chapterComments.userId, userId)
            )
        );
}
