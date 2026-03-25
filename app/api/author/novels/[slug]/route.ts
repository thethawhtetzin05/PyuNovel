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
        const updated = await db.update(novels)
            .set({
                title: body.title ?? existing.title,
                author: body.author ?? existing.author,
                description: body.description ?? existing.description,
                tags: body.tags ?? existing.tags,
                status: body.status ?? existing.status,
                updatedAt: new Date()
            })
            .where(eq(novels.id, existing.id))
            .returning()
            .get();

        return NextResponse.json({
            success: true,
            data: updated
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
