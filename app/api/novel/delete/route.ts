import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { deleteNovel } from "@/lib/resources/novels/mutations";
import { revalidatePath } from "next/cache";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { db, auth } = getServerContext();
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session) {
            return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
        }

        const { novelId } = await request.json() as { novelId: number | string };

        if (!novelId) {
            return NextResponse.json({ success: false, error: "Novel ID is missing" }, { status: 400 });
        }

        await deleteNovel(db, novelId, session.user.id);

        revalidatePath('/writer');
        return NextResponse.json({ success: true });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("Delete novel API error:", String(error));
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
