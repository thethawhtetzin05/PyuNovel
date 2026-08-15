import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { getNovelBySlug } from "@/lib/resources/novels/queries";
import { getPaginatedChaptersByNovelId, getChaptersCountByNovelId } from "@/lib/resources/chapters/queries";

export const runtime = 'edge';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const { searchParams } = new URL(request.url);

        const pageParam = parseInt(searchParams.get("page") || "1", 10);
        const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

        const limitParam = parseInt(searchParams.get("limit") || "50", 10);
        const limit = isNaN(limitParam) || limitParam < 1 ? 50 : Math.min(limitParam, 100);

        const offsetParam = searchParams.get("offset");
        const offset = offsetParam !== null ? parseInt(offsetParam, 10) : (page - 1) * limit;

        const rawVolumeId = searchParams.get("volumeId");
        let volumeId: number | null | undefined = undefined;
        if (rawVolumeId === "null" || rawVolumeId === "unassigned") {
            volumeId = null;
        } else if (rawVolumeId !== null && rawVolumeId !== "") {
            const parsed = parseInt(rawVolumeId, 10);
            if (!isNaN(parsed)) {
                volumeId = parsed;
            }
        }

        const { db } = getServerContext({ withAuth: false });

        const novel = await getNovelBySlug(db, slug);
        if (!novel) {
            return NextResponse.json({ success: false, error: "Novel not found" }, { status: 404 });
        }

        const [chapters, total] = await Promise.all([
            getPaginatedChaptersByNovelId(db, novel.id, { limit, offset, volumeId }),
            getChaptersCountByNovelId(db, novel.id, volumeId),
        ]);

        return NextResponse.json({
            success: true,
            chapters,
            total,
            page,
            limit,
            hasMore: offset + chapters.length < total,
        });
    } catch (error: any) {
        console.error("API /api/public/novel/[slug]/chapters error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
