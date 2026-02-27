import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { createAuth } from "@/lib/auth";
import { z } from "zod";
import { volumes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = 'edge';

const editVolumeSchema = z.object({
    volumeId: z.coerce.number(),
    novelId: z.coerce.number(),
    name: z.string().min(1, "Volume name is required"),
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

        const body = await request.json();
        const validation = editVolumeSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                success: false,
                error: validation.error.issues[0].message
            }, { status: 400 });
        }

        const data = validation.data;

        // Verify ownership
        const novel = await db.query.novels.findFirst({
            where: (novels, { eq }) => eq(novels.id, data.novelId)
        });

        if (!novel || novel.ownerId !== session.user.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }

        // Verify volume exists and belongs to novel
        const volume = await db.query.volumes.findFirst({
            where: (volumes, { eq, and }) => and(eq(volumes.id, data.volumeId), eq(volumes.novelId, data.novelId))
        });

        if (!volume) {
            return NextResponse.json({ success: false, error: "Volume not found" }, { status: 404 });
        }

        // Update volume name
        const result = await db.update(volumes)
            .set({ name: data.name })
            .where(eq(volumes.id, data.volumeId))
            .returning();

        return NextResponse.json({
            success: true,
            volume: result[0]
        });

    } catch (error: any) {
        console.error("Edit volume API error:", error);
        return NextResponse.json({
            success: false,
            error: error?.message || "Internal Server Error"
        }, { status: 500 });
    }
}
