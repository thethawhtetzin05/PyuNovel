import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { createChapter } from "@/lib/resources/chapters/mutations";
import { createAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const runtime = 'edge';

const chapterSchema = z.object({
    title: z.string().min(1, "ခေါင်းစဉ် မပါမဖြစ် ပါရပါမယ်"),
    content: z.string().min(1, "စာသား တိုလွန်းပါတယ်"),
    sortIndex: z.coerce.number(),
    isPaid: z.boolean().default(false),
    novelSlug: z.string(),
    novelId: z.coerce.number(),
});

export async function POST(request: NextRequest) {
    try {
        const { env } = getRequestContext();
        const db = drizzle(env.DB, { schema });

        const auth = createAuth(env.DB);
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session) {
            return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
        }

        const body = await request.json();
        const validation = chapterSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                success: false,
                error: validation.error.errors[0].message
            }, { status: 400 });
        }

        const data = validation.data;

        // Verify ownership (optional but recommended since novelId is passed)
        const novel = await db.query.novels.findFirst({
            where: (novels, { eq }) => eq(novels.id, data.novelId)
        });

        if (!novel || novel.ownerId !== session.user.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }

        const newChapter = await createChapter(db, {
            novelId: data.novelId,
            title: data.title,
            content: data.content,
            sortIndex: data.sortIndex,
            isPaid: data.isPaid,
        }, session.user.id);

        revalidatePath(`/novel/${data.novelSlug}`);

        return NextResponse.json({
            success: true,
            sortIndex: data.sortIndex
        });

    } catch (error: any) {
        console.error("Create chapter API error:", error);
        return NextResponse.json({
            success: false,
            error: error?.message || "Internal Server Error"
        }, { status: 500 });
    }
}
