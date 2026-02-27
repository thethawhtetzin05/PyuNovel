import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { z } from "zod";
import { volumes } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = 'edge';

const editVolumeSchema = z.object({
    volumeId: z.coerce.number(),
    novelId: z.coerce.number(),
    name: z.string().min(1, "Volume name is required"),
});

export async function POST(request: NextRequest) {
    try {
        const { db, auth } = getServerContext();
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

        const result = await db.update(volumes)
            .set({ name: data.name })
            .where(eq(volumes.id, data.volumeId))
            .returning();

        return NextResponse.json({ success: true, volume: result[0] });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("Edit volume API error:", String(error));
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
