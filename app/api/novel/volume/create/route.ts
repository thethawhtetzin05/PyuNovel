import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
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
        const { db, auth } = getServerContext();
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

        const novel = await db.query.novels.findFirst({
            where: (novels, { eq }) => eq(novels.id, data.novelId)
        });

        if (!novel || novel.ownerId !== session.user.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }

        const existingVolumes = await db.query.volumes.findMany({
            where: (volumes, { eq }) => eq(volumes.novelId, data.novelId),
            columns: { sortIndex: true }
        });

        const maxSortIndex = existingVolumes.length > 0
            ? Math.max(...existingVolumes.map(v => v.sortIndex))
            : 0;

        const result = await db.insert(volumes).values({
            novelId: data.novelId,
            name: data.name,
            sortIndex: maxSortIndex + 1
        }).returning();

        return NextResponse.json({ success: true, volume: result[0] });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("Create volume API error:", String(error));
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
