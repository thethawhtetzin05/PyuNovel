import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { eq, and } from "drizzle-orm";
import { novels } from "@/db/schema";

export const runtime = 'edge';

// GET /api/author/novels/[slug]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const { db, auth } = getServerContext();
        if (!auth) return NextResponse.json({ success: false, error: "Auth configuration error" }, { status: 500 });
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const novel = await db.query.novels.findFirst({
            where: and(
                eq(novels.slug, slug),
                eq(novels.ownerId, session.user.id)
            )
        });

        if (!novel) {
            return NextResponse.json({ success: false, error: "Novel not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: novel
        });

    } catch (error: any) {
        console.error("API get author novel error:", error);
        return NextResponse.json({
            success: false,
            error: error?.message || "Internal Server Error"
        }, { status: 500 });
    }
}

// PATCH /api/author/novels/[slug] (Update)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const body = await request.json();
        const { db, auth } = getServerContext();
        if (!auth) return NextResponse.json({ success: false, error: "Auth configuration error" }, { status: 500 });
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        // Verify ownership
        const existing = await db.query.novels.findFirst({
            where: and(
                eq(novels.slug, slug),
                eq(novels.ownerId, session.user.id)
            )
        });

        if (!existing) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }

        // Update fields
        // Cloudflare D1 uses .batch() for atomic updates instead of .transaction()
        const batchOperations: any[] = [];

        // 1. Update Novel Settings
        const novelUpdateData: any = {
            title: body.title ?? existing.title,
            author: body.author ?? existing.author,
            description: body.description ?? existing.description,
            tags: body.tags ?? existing.tags,
            status: body.status ?? existing.status,
            isScheduledMode: body.isScheduledMode ?? existing.isScheduledMode,
            scheduledHour: typeof body.scheduledHour === 'number' ? body.scheduledHour : existing.scheduledHour,
            chaptersPerDay: typeof body.chaptersPerDay === 'number' ? body.chaptersPerDay : existing.chaptersPerDay,
            updatedAt: new Date()
        };

        if (typeof body.chapterPrice === 'number') {
            novelUpdateData.chapterPrice = body.chapterPrice;
        }

        const updateNovelStmt = db.update(novels)
            .set(novelUpdateData)
            .where(eq(novels.id, existing.id))
            .returning();

        batchOperations.push(updateNovelStmt);

        // 2. Update Chapters Paid Status if range is provided
        if (typeof body.paidFrom === 'number' && typeof body.paidTo === 'number') {
            const { chapters } = await import("@/db/schema");
            const { gte, lte, or, lt, gt } = await import("drizzle-orm");

            // Mark within range as Paid
            const updatePaidStmt = db.update(chapters)
                .set({ isPaid: true })
                .where(and(
                    eq(chapters.novelId, existing.id),
                    gte(chapters.sortIndex, body.paidFrom),
                    lte(chapters.sortIndex, body.paidTo)
                ));

            batchOperations.push(updatePaidStmt);

            // Mark outside range as Free
            const updateFreeStmt = db.update(chapters)
                .set({ isPaid: false })
                .where(and(
                    eq(chapters.novelId, existing.id),
                    or(
                        lt(chapters.sortIndex, body.paidFrom),
                        gt(chapters.sortIndex, body.paidTo)
                    )
                ));

            batchOperations.push(updateFreeStmt);
        }

        const results = await db.batch(batchOperations as any);
        // results[0] is the array return from .returning()
        const updatedNovel = Array.isArray(results[0]) ? results[0][0] : results[0];

        return NextResponse.json({
            success: true,
            data: updatedNovel
        });

    } catch (error: any) {
        console.error("API update author novel error:", error);
        return NextResponse.json({
            success: false,
            error: error?.message || "Internal Server Error"
        }, { status: 500 });
    }
}

// DELETE /api/author/novels/[slug]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const { password } = await request.json();
        const { db, auth } = getServerContext();
        if (!auth) {
            return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
        }
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        // Verify ownership and get novel ID
        const novel = await db.query.novels.findFirst({
            where: and(
                eq(novels.slug, slug),
                eq(novels.ownerId, session.user.id)
            )
        });

        if (!novel) {
            return NextResponse.json({ success: false, error: "Novel not found or unauthorized" }, { status: 404 });
        }

        // Verify password - find any account for this user that has a password
        const userAccount = await db.query.account.findFirst({
            where: (account, { eq, and, isNotNull }) => and(
                eq(account.userId, session.user.id),
                isNotNull(account.password)
            )
        });

        if (!userAccount || !userAccount.password) {
            return NextResponse.json({ success: false, error: "Deletion requires an email/password account." }, { status: 403 });
        }

        // Use the verifyPassword method from better-auth/crypto
        const { verifyPassword } = await import("better-auth/crypto");
        const isPasswordCorrect = await verifyPassword({
            hash: userAccount.password,
            password: password
        });

        if (!isPasswordCorrect) {
            return NextResponse.json({ success: false, error: "Invalid password" }, { status: 403 });
        }

        // Delete novel using mutation helper
        const { deleteNovel } = await import("@/lib/resources/novels/mutations");
        await deleteNovel(db, novel.id, session.user.id);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("API delete author novel error:", error);
        return NextResponse.json({
            success: false,
            error: error?.message || "Internal Server Error"
        }, { status: 500 });
    }
}
