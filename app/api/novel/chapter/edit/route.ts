import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { updateChapter } from "@/lib/resources/chapters/mutations";
import { createAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { env } = getRequestContext();
        const db = drizzle(env.DB, { schema });

        const auth = createAuth(env.DB);
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
        });

        revalidatePath(`/novel/${novelSlug}`);
        return NextResponse.json({ success: true, sortIndex, slug: novelSlug });

    } catch (error: any) {
        console.error("Edit chapter API error:", error);
        return NextResponse.json({
            success: false,
            error: error?.message || "Internal Server Error"
        }, { status: 500 });
    }
}
