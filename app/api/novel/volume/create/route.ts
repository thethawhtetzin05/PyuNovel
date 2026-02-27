import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { createAuth } from "@/lib/auth";
import { z } from "zod";
import { volumes } from "@/db/schema";

export const runtime = 'edge';

const volumeSchema = z.object({
    name: z.string().min(1, "Volume name is required"),
    novelId: z.coerce.number(),
    novelSlug: z.string(),
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
        const validation = volumeSchema.safeParse(body);

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

        // Get max sortIndex for this novel's volumes
        const existingVolumes = await db.query.volumes.findMany({
            where: (volumes, { eq }) => eq(volumes.novelId, data.novelId),
            columns: { sortIndex: true }
        });

        const maxSortIndex = existingVolumes.length > 0
            ? Math.max(...existingVolumes.map(v => v.sortIndex))
            : 0;

        const nextSortIndex = maxSortIndex + 1;

        // Insert new volume
        const result = await db.insert(volumes).values({
            novelId: data.novelId,
            name: data.name,
            sortIndex: nextSortIndex
        }).returning();

        const newVolume = result[0];

        return NextResponse.json({
            success: true,
            volume: newVolume
        });

    } catch (error: any) {
        console.error("Create volume API error:", error);
        return NextResponse.json({
            success: false,
            error: error?.message || "Internal Server Error"
        }, { status: 500 });
    }
}
