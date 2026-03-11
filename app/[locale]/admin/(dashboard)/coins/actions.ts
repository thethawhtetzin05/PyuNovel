'use server';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { drizzle } from 'drizzle-orm/d1';
import { coinTransactions, user } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function adminUpdateUserCoinsAction(
    userId: string,
    amount: number,
    type: 'earn' | 'spend' | 'topup' | 'refund'
) {
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get('admin_session')?.value === 'authenticated';

    if (!isAdmin) {
        return { success: false, error: 'Unauthorized' };
    }

    const { env } = getRequestContext();
    const db = drizzle(env.DB);

    try {
        const operation = type === 'spend' ? sql`${user.coins} - ${amount}` : sql`${user.coins} + ${amount}`;

        const deductCoinsQuery = db
            .update(user)
            .set({ coins: operation })
            .where(eq(user.id, userId));

        const uuid = globalThis.crypto.randomUUID();
        const createTxnQuery = db
            .insert(coinTransactions)
            .values({
                id: uuid,
                userId: userId,
                amount: amount,
                type: type,
                status: 'success',
                reference: `admin_manual_grant`,
                createdAt: new Date(),
            });

        await db.batch([deductCoinsQuery, createTxnQuery]);

        revalidatePath('/admin/coins');
        revalidatePath(`/profile`);
        return { success: true };
    } catch (error: any) {
        console.error('Error updating config:', error);
        return { success: false, error: error.message || 'Failed to update user coins' };
    }
}
