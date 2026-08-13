import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { getNovels, getTopNovelsByViews } from "@/lib/resources/novels/queries";
import { getLatestChapters } from "@/lib/resources/chapters/queries";

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Number(searchParams.get("page")) || 1;
        const limit = Number(searchParams.get("limit")) || 20;

        const { db } = getServerContext({ withAuth: false });

        const [spotlightNovels, latestChapters, allNovels] = await Promise.all([
            getTopNovelsByViews(db, 6),
            getLatestChapters(db, 10),
            getNovels(db, page, limit),
        ]);

        return NextResponse.json({
            success: true,
            spotlightNovels,
            latestChapters,
            allNovels,
        });
    } catch (error: any) {
        console.error("API /api/public/home error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
