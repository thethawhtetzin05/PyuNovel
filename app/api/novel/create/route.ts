import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { createNovel } from "@/lib/resources/novels/mutations";
import { CreateNovelSchema } from "@shared/schemas/novel";
import { processTags } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { db, auth, env } = getServerContext();
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session) {
            return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
        }

        const formData = await request.formData();
        const validatedFields = CreateNovelSchema.safeParse({
            englishTitle: formData.get('englishTitle'),
            title: formData.get('title'),
            author: session.user.name || "Unknown Author",
            description: formData.get('description'),
            tags: formData.get('tags'),
        });

        if (!validatedFields.success) {
            return NextResponse.json({
                success: false,
                error: "Invalid Input: " + Object.values(validatedFields.error.flatten().fieldErrors).flat().join(", ")
            }, { status: 400 });
        }

        const { englishTitle, title, description, tags } = validatedFields.data;
        const coverFile = formData.get('coverImage') as File;

        let imageUrl = "/placeholder-cover.jpg";

        if (coverFile && coverFile.size > 0 && coverFile.name !== "undefined") {
            try {
                const fileName = `${crypto.randomUUID()}-${coverFile.name}`;
                await env.R2_BUCKET.put(fileName, await coverFile.arrayBuffer(), {
                    httpMetadata: { contentType: coverFile.type },
                });
                imageUrl = `/api/file/${fileName}`;
            } catch (uploadError) {
                console.error("Image Upload Failed:", String(uploadError));
            }
        }

        const newNovel = await createNovel(db, session.user.id, {
            englishTitle,
            title,
            description: description || '',
            imageUrl,
            tags: processTags(tags || ''),
            author: session.user.name || "Unknown Author",
            status: 'ongoing'
        });

        // Auto-upgrade Role to Writer
        const user = session.user as any;
        if (newNovel && user.role === 'reader') {
            await db.update(schema.user)
                .set({ role: 'writer', updatedAt: new Date() })
                .where(eq(schema.user.id, user.id))
                .run();
        }

        revalidatePath('/writer', 'page');
        revalidatePath('/', 'page');
        return NextResponse.json({ success: true, slug: newNovel.slug, novelId: newNovel.id });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("Create novel API error:", String(error));
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
