"use server";

import { getRequestContext } from "@cloudflare/next-on-pages";
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

import { calculateLevel, expForNextLevel } from "@/lib/leveling";

export async function claimDailyCheckIn() {
    try {
        const { env } = getRequestContext();
        const db = drizzle(env.DB, { schema });
        const auth = createAuth(env.DB);

        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return { success: false, error: "Not authenticated" };

        const userId = session.user.id;
        const user = await db.query.user.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
        });

        if (!user) return { success: false, error: "User not found" };

        const now = new Date();
        const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

        // Check if already claimed today
        let newStreak: number;
        if (user.lastCheckIn) {
            const lastCheckInDate = new Date(user.lastCheckIn);
            const lastCheckInUTC = new Date(Date.UTC(lastCheckInDate.getUTCFullYear(), lastCheckInDate.getUTCMonth(), lastCheckInDate.getUTCDate()));
            if (lastCheckInUTC >= todayUTC) {
                return { success: false, error: "Already checked in today" };
            }

            // Check if the previous check-in was yesterday (to continue streak)
            const yesterdayUTC = new Date(todayUTC);
            yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1);
            const isConsecutive = lastCheckInUTC.getTime() === yesterdayUTC.getTime();

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

        // Update user record
        await db.update(schema.user)
            .set({
                exp: newExp,
                level: newLevel,
                lastCheckIn: now,
                checkInStreak: newStreak,
            })
            .where(eq(schema.user.id, userId));

        return {
            success: true,
            expGained,
            newExp,
            newLevel,
            streak: newStreak,
            leveledUp,
            nextLevelExp: expForNextLevel(newLevel),
        };
    } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        console.error("[claimDailyCheckIn] Error:", errMsg, e);
        return { success: false, error: errMsg };
    }
}
