import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { deleteChapter } from "@/lib/resources/chapters/mutations";
import { createAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { chapterId, novelSlug } = await request.json() as {
            chapterId: string | number;
            novelSlug: string;
        };

        if (!chapterId || !novelSlug) {
            return NextResponse.json({ success: false, error: "Missing required data" }, { status: 400 });
        }

        const { env } = getRequestContext();
        const db = drizzle(env.DB, { schema });

        const auth = createAuth(env.DB);
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session) {
            return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
        }

        await deleteChapter(db, chapterId, session.user.id);

        revalidatePath(`/novel/${novelSlug}`);
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Delete chapter API error:", error);
        return NextResponse.json({
            success: false,
            error: error?.message || "Internal Server Error"
        }, { status: 500 });
    }
}
