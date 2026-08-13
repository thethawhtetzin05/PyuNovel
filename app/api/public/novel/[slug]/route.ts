import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { getNovelBySlug } from "@/lib/resources/novels/queries";
import { getVolumesByNovelId } from "@/lib/resources/volumes/queries";
import { getChaptersByNovelId } from "@/lib/resources/chapters/queries";

export const runtime = 'edge';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const { db } = getServerContext({ withAuth: false });

        const novel = await getNovelBySlug(db, slug);
        if (!novel) {
            return NextResponse.json({ success: false, error: "Novel not found" }, { status: 404 });
        }

        const [volumes, chapters] = await Promise.all([
            getVolumesByNovelId(db, novel.id),
            getChaptersByNovelId(db, novel.id),
        ]);

        return NextResponse.json({
            success: true,
            novel,
            volumes,
            chapters,
        });
    } catch (error: any) {
        console.error("API /api/public/novel/[slug] error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
