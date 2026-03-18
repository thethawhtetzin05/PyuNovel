import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { createAuth } from "@/lib/auth";
import { createReview } from "@/lib/resources/reviews/mutations";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { notifyWriter } from "@/lib/telegram";

export const runtime = 'edge';

const reviewSchema = z.object({
    novelId: z.coerce.number(),
    novelSlug: z.string(),
    rating: z.coerce.number().min(1).max(5),
    comment: z.string().optional()
});

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
        const validation = reviewSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                success: false,
                error: validation.error.issues[0].message
            }, { status: 400 });
        }

        const data = validation.data;

        // Get novel to find writerId
        const novel = await db.query.novels.findFirst({
            where: (novels, { eq }) => eq(novels.id, data.novelId),
            columns: { ownerId: true, title: true }
        });

        await createReview(db, {
            novelId: data.novelId,
            rating: data.rating,
            comment: data.comment
        }, session.user.id);

        if (novel && novel.ownerId) {
            const stars = "⭐".repeat(data.rating);
            const notificationMsg = `⭐️ <b>ဝေဖန်ချက်အသစ် ရရှိပါသည်!</b>\n\nဝတ္ထု: <i>${novel.title}</i>\nအမှတ်: ${stars} (${data.rating}/5)\n\n"<i>${data.comment || "စာသားမပါရှိပါ"}</i>"`;
            
            // Fire and forget notification
            notifyWriter(db, env, novel.ownerId, notificationMsg).catch(console.error);
        }

        revalidatePath(`/novel/${data.novelSlug}`);
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Create review API error:", error);
        return NextResponse.json({
            success: false,
            error: error?.message || "Internal Server Error"
        }, { status: error.message.includes('already reviewed') ? 409 : 500 });
    }
}
