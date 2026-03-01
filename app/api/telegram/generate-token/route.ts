import { NextRequest, NextResponse } from "next/server";
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { verification } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const env = getRequestContext().env;
        const db = getDb(env.DB);

        const auth = createAuth(env.DB);
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userId = session.user.id;

        // Generate an 8-character token (uppercase, lowercase, numbers)
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let token = "";
        for (let i = 0; i < 8; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Expires in 5 minutes
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Delete any existing tokens for this user to avoid clutter
        await db.delete(verification).where(
            and(
                eq(verification.identifier, "telegram"),
                eq(verification.value, userId)
            )
        );

        // Insert new 6-char token
        await db.insert(verification).values({
            id: token,
            identifier: "telegram",
            value: userId,
            expiresAt: expiresAt,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return NextResponse.json({ token });
    } catch (error) {
        console.error("[TELEGRAM_GENERATE_TOKEN]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
