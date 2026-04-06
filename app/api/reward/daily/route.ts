import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export const runtime = "edge";

export async function POST(_req: Request) {
    try {
        const { env } = getRequestContext();
        const db = drizzle(env.DB, { schema });
        const auth = createAuth(env.DB);
        if (!auth) {
            return NextResponse.json({ error: "Auth configuration error" }, { status: 500 });
        }
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const userRecord = await db.query.user.findFirst({
            where: eq(schema.user.id, userId),
        });

        if (!userRecord) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Determine the 6 AM threshold for today in Myanmar Time (+6:30)
        // Actually, simple logic: let's use JS Date and adjust to +6:30 or just use current UTC
        // For simplicity, we can do resetting logic every 24 hours from the last reset or based on UTC date of 6am.
        const now = new Date();
        const mmTimeOffest = 6.5 * 60 * 60 * 1000;
        const mmNow = new Date(now.getTime() + mmTimeOffest);

        // reset happens when mmNow is past 6 AM and lastDailyReset was before today's 6 AM
        // A simplified daily reset check: Day of year and hour > 6
        const today6AM = new Date(mmNow);
        today6AM.setUTCHours(0 - 6.5 + 6, 0, 0, 0); // Approx 6 AM local time
        if (now.getTime() < today6AM.getTime()) {
            today6AM.setDate(today6AM.getDate() - 1); // Yesterday's 6 AM
        }

        if (userRecord.lastDailyReset && userRecord.lastDailyReset.getTime() >= today6AM.getTime()) {
            return NextResponse.json({ message: "Already claimed for today" }, { status: 400 });
        }

        const newCoupons: (typeof schema.coupons.$inferInsert)[] = [];
        const yieldCount = userRecord.couponYield || 1;
        const longevityDays = userRecord.couponLongevity || 1;

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + longevityDays);

        for (let i = 0; i < yieldCount; i++) {
            newCoupons.push({
                userId: userId,
                expiresAt: expiryDate,
            });
        }

        await db.transaction(async (tx) => {
            await tx.insert(schema.coupons).values(newCoupons);
            await tx.update(schema.user)
                .set({ lastDailyReset: now })
                .where(eq(schema.user.id, userId));
        });

        return NextResponse.json({ success: true, message: "Daily reward claimed", count: yieldCount });
    } catch (error) {
        console.error("Daily reward error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
