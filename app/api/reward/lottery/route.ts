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
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const userRecord = await db.query.user.findFirst({
            where: eq(schema.user.id, userId),
        });

        if (!userRecord || userRecord.lotteryChances <= 0) {
            return NextResponse.json({ error: "Not enough chances" }, { status: 400 });
        }

        // Determine Reward (70% Yield, 30% Longevity)
        const random = Math.random();
        let rewardType = "yield";
        let rewardMessage = "Coupon Yield +1 🎫";

        if (random > 0.7) {
            rewardType = "longevity";
            rewardMessage = "Coupon Longevity +1 Day ⏳";
        }

        await db.transaction(async (tx) => {
            if (rewardType === "yield") {
                await tx.update(schema.user)
                    .set({
                        couponYield: (userRecord.couponYield || 1) + 1,
                        lotteryChances: userRecord.lotteryChances - 1
                    })
                    .where(eq(schema.user.id, userId));
            } else {
                await tx.update(schema.user)
                    .set({
                        couponLongevity: (userRecord.couponLongevity || 1) + 1,
                        lotteryChances: userRecord.lotteryChances - 1
                    })
                    .where(eq(schema.user.id, userId));
            }
        });

        return NextResponse.json({
            success: true,
            reward: rewardType,
            message: rewardMessage
        });
    } catch (error) {
        console.error("Lottery reward error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
