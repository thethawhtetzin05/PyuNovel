import { getRequestContext } from '@cloudflare/next-on-pages';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';
import { createAuth } from '@/lib/auth';

/**
 * Server Action တိုင်းတွင် db နှင့် auth ကို ထပ်ခါတလဲလဲ init မလုပ်ရအောင်
 * ဤ helper function တစ်ခုတည်းမှ ယူသုံးပါ။
 */
export function getServerContext() {
    const { env } = getRequestContext();
    const db = drizzle(env.DB, { schema });
    const auth = createAuth(env.DB);
    return { db, auth, env };
}
