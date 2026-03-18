import { getRequestContext } from '@cloudflare/next-on-pages';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';
import { createAuth } from '@/lib/auth';

/**
 * Server Action တိုင်းတွင် db နှင့် auth ကို ထပ်ခါတလဲလဲ init မလုပ်ရအောင်
 * ဤ helper function တစ်ခုတည်းမှ ယူသုံးပါ။
 */
export function getServerContext(options: { withAuth?: boolean } = { withAuth: true }) {
    const context = getRequestContext();
    const env = context?.env || (process.env as any);
    
    if (!env?.DB) {
        throw new Error("Database binding (DB) is missing in environment.");
    }

    const db = drizzle(env.DB, { schema });
    
    // Auth initialization is optional to prevent crashes in non-browser headers environments (like Telegram Webhook)
    const auth = options.withAuth ? createAuth(env.DB) : null;
    
    return { db, auth, env };
}
