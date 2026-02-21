import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// Database နဲ့ ချိတ်ဆက်မည့် Function
// Env.DB ဆိုတာ Cloudflare က ပေးမယ့် Binding ပါ
export const getDb = (dbBinding: D1Database) => {
  return drizzle(dbBinding, { schema });
};