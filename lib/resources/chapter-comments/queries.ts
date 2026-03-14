import { eq, and, sql } from "drizzle-orm";
import * as schema from "@/db/schema";

export async function getChapterComments(db: any, chapterId: number) {
    return await db.query.chapterComments.findMany({
        where: and(
            eq(schema.chapterComments.chapterId, chapterId),
            sql`${schema.chapterComments.parentCommentId} IS NULL`
        ),
        with: {
            user: {
                columns: {
                    id: true,
                    name: true,
                    image: true,
                }
            },
            votes: true,
            replies: {
                with: {
                    user: {
                        columns: {
                            id: true,
                            name: true,
                            image: true,
                        }
                    },
                    votes: true,
                }
            }
        },
        orderBy: (comments: any, { desc }: any) => [desc(comments.createdAt)],
    });
}


/**
 * Get comment counts for each paragraph in a chapter
 */
export async function getParagraphCommentCounts(db: any, chapterId: number) {
    const results = await db.select({
        paragraphIndex: schema.chapterComments.paragraphIndex,
        count: sql<number>`count(*)`,
    })
        .from(schema.chapterComments)
        .where(eq(schema.chapterComments.chapterId, chapterId))
        .groupBy(schema.chapterComments.paragraphIndex);

    return results as { paragraphIndex: number | null, count: number }[];
}
