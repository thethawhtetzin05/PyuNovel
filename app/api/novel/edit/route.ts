import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { updateNovel } from "@/lib/resources/novels/mutations";
import { createAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { env } = getRequestContext();
        const db = drizzle(env.DB, { schema });

        const auth = createAuth(env.DB);
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session) {
            return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
        }

        const formData = await request.formData();
        const novelId = formData.get('novelId') as string;
        const oldImageUrl = formData.get('oldImageUrl') as string;
        const title = formData.get('title') as string;
        const englishTitle = formData.get('englishTitle') as string;
        const description = formData.get('description') as string;
        const tags = formData.get('tags') as string;
        const coverFile = formData.get('coverImage') as File;

        if (!novelId || !title || !englishTitle) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        let imageUrl = oldImageUrl;

        if (coverFile && coverFile.size > 0 && coverFile.name !== "undefined") {
            try {
                const fileName = `${crypto.randomUUID()}-${coverFile.name}`;
                await env.R2_BUCKET.put(fileName, await coverFile.arrayBuffer(), {
                    httpMetadata: { contentType: coverFile.type },
                });
                imageUrl = `/api/file/${fileName}`;
            } catch (error) {
                console.error("Image Upload Failed:", error);
            }
        }

        const processedTags = tags
            ? tags.split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0)
                .map(tag => {
                    const lower = tag.toLowerCase();
                    return lower.charAt(0).toUpperCase() + lower.slice(1);
                })
                .join(', ')
            : '';

        const updatedNovel = await updateNovel(db, novelId, {
            title,
            englishTitle,
            description,
            imageUrl,
            tags: processedTags,
            slug: englishTitle
        }, session.user.id);

        revalidatePath(`/novel/${updatedNovel.slug}`);
        return NextResponse.json({ success: true, slug: updatedNovel.slug });

    } catch (error: any) {
        console.error("Edit novel API error:", error);
        return NextResponse.json({
            success: false,
            error: error?.message || "Internal Server Error"
        }, { status: 500 });
    }
}
