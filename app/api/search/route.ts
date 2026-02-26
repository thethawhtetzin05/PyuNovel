import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/d1";
import { searchNovels } from "@/lib/resources/novels/queries";

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q") || "";

        if (!query.trim()) {
            return NextResponse.json({ success: true, results: [] });
        }

        const { env } = getRequestContext();
        const db = drizzle(env.DB);

        const results = await searchNovels(db, query, 6);

        return NextResponse.json({
            success: true,
            results
        });

    } catch (error: any) {
        console.error("Search API Error:", error);
        return NextResponse.json({
            success: false,
            error: "Internal Error"
        }, { status: 500 });
    }
}
