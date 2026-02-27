import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { z } from "zod";
import { volumes, chapters } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = 'edge';

const deleteVolumeSchema = z.object({
    volumeId: z.coerce.number(),
    novelId: z.coerce.number(),
});

export async function POST(request: NextRequest) {
    try {
        const { db, auth } = getServerContext();
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session) {
            return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
        }

        const body = await request.json();
        const validation = deleteVolumeSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                success: false,
                error: validation.error.issues[0].message
            }, { status: 400 });
        }

        const data = validation.data;

        const novel = await db.query.novels.findFirst({
            where: (novels, { eq }) => eq(novels.id, data.novelId)
        });

        if (!novel || novel.ownerId !== session.user.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }

        const volume = await db.query.volumes.findFirst({
            where: (volumes, { eq, and }) => and(eq(volumes.id, data.volumeId), eq(volumes.novelId, data.novelId))
        });

        if (!volume) {
            return NextResponse.json({ success: false, error: "Volume not found" }, { status: 404 });
        }

        // 1. Unassign chapters from volume
        await db.update(chapters)
            .set({ volumeId: null })
            .where(eq(chapters.volumeId, data.volumeId));

        // 2. Delete the volume
        await db.delete(volumes).where(eq(volumes.id, data.volumeId));

        return NextResponse.json({ success: true });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("Delete volume API error:", String(error));
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
