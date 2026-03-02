import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { chapters, novels } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export const runtime = 'edge';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { db } = getServerContext();
        const { slug } = await params;

        // ၁။ Novel ID ကို အရင်ရှာမယ်
        const novel = await db.query.novels.findFirst({
            where: eq(novels.slug, slug),
            columns: { id: true, title: true }
        });

        if (!novel) {
            return NextResponse.json({ success: false, error: "Novel not found" }, { status: 404 });
        }

        // ၂။ အခန်းအားလုံးကို Content ပါ ဆွဲထုတ်မယ်
        const allChapters = await db.query.chapters.findMany({
            where: eq(chapters.novelId, novel.id),
            orderBy: [asc(chapters.sortIndex)],
            columns: {
                id: true,
                title: true,
                content: true,
                sortIndex: true,
                prevChapterId: true, // Logic လိုအပ်ရင် တွက်ထည့်ရမယ် (Drizzle relation သုံးရင် ပိုလွယ်)
                // For simple loop logic, we might calculate prev/next in client or ignore
            }
        });

        // Offline DB format အတိုင်း ပြန်ပေးမယ်
        return NextResponse.json({
            success: true,
            novel: novel,
            chapters: allChapters
        });

    } catch (error) {
        console.error("Full download error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
