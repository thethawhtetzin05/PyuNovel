import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { getNovelBySlug } from "@/lib/resources/novels/queries";
import { getReviewsByNovelId } from "@/lib/resources/reviews/queries";

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

        const reviewsList = await getReviewsByNovelId(db, novel.id);
        const totalReviews = reviewsList.length;
        const sum = reviewsList.reduce((acc, r) => acc + (r.rating || 0), 0);
        const avgRating = totalReviews > 0 ? Number((sum / totalReviews).toFixed(1)) : 0;

        return NextResponse.json({
            success: true,
            avgRating,
            totalReviews,
            reviews: reviewsList
        });

    } catch (error: any) {
        console.error("Public novel reviews GET API error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
