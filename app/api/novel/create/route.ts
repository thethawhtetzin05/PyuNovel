import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { createNovel } from "@/lib/resources/novels/mutations";
import { createAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";

export const runtime = 'edge';

const CreateNovelSchema = z.object({
    englishTitle: z.string().min(1, "English Title is required"),
    title: z.string().min(1, "Title is required"),
    description: z.string().optional().default(""),
    tags: z.string().optional().default(""),
});

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
        const validatedFields = CreateNovelSchema.safeParse({
            englishTitle: formData.get('englishTitle'),
            title: formData.get('title'),
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

        const newNovel = await createNovel(db, session.user.id, {
            englishTitle,
            title,
            description,
            imageUrl,
            tags: processedTags,
            author: session.user.name || "Unknown Author",
            status: 'ongoing'
        });

        // Auto-upgrade Role to Writer if they are currently a Reader
        if (newNovel && session.user.role === 'reader') {
            await db.update(schema.user)
                .set({ role: 'writer', updatedAt: new Date() })
                .where(eq(schema.user.id, session.user.id))
                .run();
        }

        revalidatePath('/writer', 'page');
        revalidatePath('/', 'page');

        return NextResponse.json({
            success: true,
            slug: newNovel.slug
        });

    } catch (error: any) {
        console.error("Create novel API error:", error);
        return NextResponse.json({
            success: false,
            error: error?.message || "Internal Server Error"
        }, { status: 500 });
    }
}
