import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getServerContext } from "@/lib/server-context";
import { updateNovel } from "@/lib/resources/novels/mutations";
import { processTags } from "@/lib/utils";
import { generateSlug } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { db, auth } = getServerContext();
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

        const { env } = getRequestContext();
        let imageUrl = oldImageUrl;

        if (coverFile && coverFile.size > 0 && coverFile.name !== "undefined") {
            try {
                const fileName = `${globalThis.crypto.randomUUID()}-${coverFile.name}`;
                await env.R2_BUCKET.put(fileName, await coverFile.arrayBuffer(), {
                    httpMetadata: { contentType: coverFile.type },
                });
                imageUrl = `/api/file/${fileName}`;
            } catch (uploadError) {
                console.error("Image Upload Failed:", String(uploadError));
            }
        }

        const updatedNovel = await updateNovel(db, novelId, {
            title,
            englishTitle,
            description,
            coverUrl: imageUrl, // ✅ Fix: mapping imageUrl to correct schema field 'coverUrl'
            tags: processTags(tags),
            slug: generateSlug(englishTitle), 
        }, session.user.id);

        revalidatePath(`/novel/${updatedNovel.slug}`);
        return NextResponse.json({ success: true, slug: updatedNovel.slug });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("Edit novel API error:", String(error));
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
