import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/d1";
import { filterNovels } from "@/lib/resources/novels/queries";

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q") || "";
        const status = searchParams.get("status") || "";
        const tag = searchParams.get("tag") || "";
        const sort = searchParams.get("sort") || "latest";
        const limit = Number(searchParams.get("limit")) || 20;

        const { env } = getRequestContext();
        const db = drizzle(env.DB);

        const results = await filterNovels(db, { q, status, tag, sort, limit });

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
