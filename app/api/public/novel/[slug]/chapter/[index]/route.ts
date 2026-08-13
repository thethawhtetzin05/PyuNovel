import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { getChapterForReader } from "@/lib/resources/chapters/queries";

export const runtime = 'edge';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string; index: string }> }
) {
    try {
        const { slug, index } = await params;
        const { db } = getServerContext({ withAuth: false });

        const result = await getChapterForReader(db, slug, index);
        if (!result) {
            return NextResponse.json({ success: false, error: "Chapter not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error("API /api/public/novel/[slug]/chapter/[index] error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
