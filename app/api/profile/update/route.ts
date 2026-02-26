import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createAuth } from "@/lib/auth";
import { drizzle } from "drizzle-orm/d1";
import { updateUser } from "@/lib/resources/users/mutations";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    const { env } = getRequestContext();
    const db = drizzle(env.DB);
    const auth = createAuth(env.DB);

    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const name = formData.get("name") as string;
        const imageFile = formData.get("image") as File;

        const updateData: any = {};

        if (name) updateData.name = name;

        // Handle Image Upload to R2
        if (imageFile && imageFile.size > 0) {
            const fileName = `avatars/${crypto.randomUUID()}-${imageFile.name}`;
            await env.R2_BUCKET.put(fileName, await imageFile.arrayBuffer(), {
                httpMetadata: { contentType: imageFile.type },
            });
            updateData.image = `/api/file/${fileName}`;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ success: false, error: "No changes provided" }, { status: 400 });
        }

        const updatedUser = await updateUser(db, session.user.id, updateData);

        return NextResponse.json({
            success: true,
            user: updatedUser
        });

    } catch (error: any) {
        console.error("Profile Update Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Internal Server Error"
        }, { status: 500 });
    }
}
