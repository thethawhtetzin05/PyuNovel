import { getRequestContext } from "@cloudflare/next-on-pages";
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { calculateLevel, expForNextLevel } from "@/lib/leveling";

export const runtime = 'edge';

export async function POST() {
    try {
        const { env } = getRequestContext();
        const db = drizzle(env.DB, { schema });
        const auth = createAuth(env.DB);
        if (!auth) {
            return Response.json({ success: false, error: "Auth configuration error" }, { status: 500 });
        }

        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            return Response.json({ success: false, error: "Not authenticated" }, { status: 401 });
        }

        const userId = session.user.id;
        const user = await db.query.user.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
        });

        if (!user) {
            return Response.json({ success: false, error: "User not found" }, { status: 404 });
        }

        const now = new Date();
        // Convert to Myanmar Time (+6:30)
        const mmTimeOffset = 6.5 * 60 * 60 * 1000;
        const mmNow = new Date(now.getTime() + mmTimeOffset);

        // Midnight Myanmar Time representation
        const todayMM = new Date(Date.UTC(mmNow.getUTCFullYear(), mmNow.getUTCMonth(), mmNow.getUTCDate()));

        // Check if already claimed today
        let newStreak: number;
        if (user.lastCheckIn) {
            const lastCheckInDate = new Date(user.lastCheckIn);
            const mmLastCheckIn = new Date(lastCheckInDate.getTime() + mmTimeOffset);

            const lastCheckInMM = new Date(Date.UTC(
                mmLastCheckIn.getUTCFullYear(),
                mmLastCheckIn.getUTCMonth(),
                mmLastCheckIn.getUTCDate()
            ));

            if (lastCheckInMM >= todayMM) {
                return Response.json({ success: false, error: "Already checked in today" }, { status: 400 });
            }

            // Check if the previous check-in was yesterday (to continue streak)
            const yesterdayMM = new Date(todayMM);
            yesterdayMM.setUTCDate(yesterdayMM.getUTCDate() - 1);
            const isConsecutive = lastCheckInMM.getTime() === yesterdayMM.getTime();

            newStreak = isConsecutive ? (user.checkInStreak ?? 0) + 1 : 1;
        } else {
            newStreak = 1;
        }

        // Tiered daily EXP cap based on streak milestone
        let maxBonus: number;
        if (newStreak >= 365) {
            maxBonus = 90;
        } else if (newStreak >= 90) {
            maxBonus = 50;
        } else if (newStreak >= 30) {
            maxBonus = 30;
        } else {
            maxBonus = 20;
        }
        const streakBonus = Math.min((newStreak - 1) * 2, maxBonus);
        const expGained = 10 + streakBonus;

        const newExp = (user.exp ?? 0) + expGained;
        const oldLevel = user.level ?? 0;
        const newLevel = calculateLevel(newExp);
        const leveledUp = newLevel > oldLevel;

        // Update user record & Grant Coupons in one transaction
        const yieldCount = user.couponYield || 1;
        const longevityDays = user.couponLongevity || 1;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + longevityDays);

        const newCoupons: (typeof schema.coupons.$inferInsert)[] = [];
        for (let i = 0; i < yieldCount; i++) {
            newCoupons.push({
                userId: userId,
                expiresAt: expiryDate,
            });
        }

        await db.transaction(async (tx) => {
            await tx.update(schema.user)
                .set({
                    exp: newExp,
                    level: newLevel,
                    lastCheckIn: now,
                    checkInStreak: newStreak,
                    ...(leveledUp && { lotteryChances: (user.lotteryChances || 0) + (newLevel - oldLevel) })
                })
                .where(eq(schema.user.id, userId));

            if (newCoupons.length > 0) {
                await tx.insert(schema.coupons).values(newCoupons);
            }
        });

        return Response.json({
            success: true,
            expGained,
            newExp,
            newLevel,
            streak: newStreak,
            leveledUp,
            nextLevelExp: expForNextLevel(newLevel),
            couponsGained: yieldCount
        });
    } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        console.error("[POST /api/checkin] Error:", errMsg, e);
        return Response.json({ success: false, error: errMsg }, { status: 500 });
    }
}
