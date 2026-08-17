import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { eq, sql } from "drizzle-orm";
import { user, session as sessionTable, coinTransactions } from "@/db/schema";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { db, auth } = getServerContext({ withAuth: true });
        let session = await auth?.api?.getSession({ headers: request.headers });

        // Fallback for mobile apps passing Bearer token directly
        let userId = session?.user?.id;
        if (!userId) {
            const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
            if (authHeader && authHeader.startsWith("Bearer ")) {
                const bearerToken = authHeader.substring(7).trim();
                const foundSession = await db.query.session.findFirst({
                    where: eq(sessionTable.token, bearerToken)
                });
                if (foundSession?.userId) {
                    userId = foundSession.userId;
                }
            }
        }

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const topupAmount = 500;

        // Perform coin update
        const updateCoinsQuery = db
            .update(user)
            .set({ coins: sql`${user.coins} + ${topupAmount}` })
            .where(eq(user.id, userId));

        // Insert coin transaction
        const uuid = globalThis.crypto.randomUUID();
        const createTxnQuery = db
            .insert(coinTransactions)
            .values({
                id: uuid,
                userId: userId,
                amount: topupAmount,
                type: 'topup',
                status: 'success',
                reference: 'simulated_topup_mobile',
                createdAt: new Date(),
            });

        await db.batch([updateCoinsQuery, createTxnQuery]);

        // Get updated user profile
        const updatedUser = await db.query.user.findFirst({
            where: eq(user.id, userId)
        });

        return NextResponse.json({ 
            success: true, 
            coins: updatedUser?.coins || 0 
        });

    } catch (error: any) {
        console.error("Simulated top-up API Error:", error);
        return NextResponse.json({ 
            success: false, 
            error: error?.message || "Internal Server Error" 
        }, { status: 500 });
    }
}
