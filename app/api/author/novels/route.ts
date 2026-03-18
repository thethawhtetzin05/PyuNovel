import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { eq, desc } from "drizzle-orm";
import { novels } from "@/db/schema";

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    try {
        const { db, auth } = getServerContext();
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        const authorNovels = await db.query.novels.findMany({
            where: eq(novels.ownerId, userId),
            orderBy: [desc(novels.updatedAt)]
        });

        return NextResponse.json({
            success: true,
            data: authorNovels
        });

    } catch (error: any) {
        console.error("API get author novels error:", error);
        return NextResponse.json({
            success: false,
            error: error?.message || "Internal Server Error"
        }, { status: 500 });
    }
}
