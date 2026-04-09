import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq, desc, and, lt } from "drizzle-orm";

export const runtime = "edge";

export async function GET() {
    try {
        const { env } = getRequestContext();
        const db = drizzle(env.DB, { schema });
        const auth = createAuth(env.DB);
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const now = new Date();

        // 1. On-demand cleanup: Delete expired coupons for this user
        await db.delete(schema.coupons)
            .where(
                and(
                    eq(schema.coupons.userId, userId),
                    lt(schema.coupons.expiresAt, now)
                )
            );

        // 2. Fetch remaining active coupons
        const userCoupons = await db.query.coupons.findMany({
            where: eq(schema.coupons.userId, userId),
            orderBy: [desc(schema.coupons.createdAt)],
        });

        return NextResponse.json({ success: true, coupons: userCoupons });
    } catch (error) {
        console.error("Fetch coupons error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
