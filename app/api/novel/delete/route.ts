import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { deleteNovel } from "@/lib/resources/novels/mutations";
import { createAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { novelId } = await request.json() as { novelId: number | string };

        if (!novelId) {
            return NextResponse.json({ success: false, error: "Novel ID is missing" }, { status: 400 });
        }

        const { env } = getRequestContext();
        const db = drizzle(env.DB, { schema });

        const auth = createAuth(env.DB);
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session) {
            return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
        }

        await deleteNovel(db, novelId, session.user.id);

        revalidatePath('/writer');
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Delete novel API error:", error);
        return NextResponse.json({
            success: false,
            error: error?.message || "Internal Server Error"
        }, { status: 500 });
    }
}
