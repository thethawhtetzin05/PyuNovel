import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema.ts', // ဇယားတွေ ဘယ်မှာရေးထားလဲ
  out: './drizzle', // Database အပြောင်းအလဲ မှတ်တမ်းထားမည့်နေရာ
  dialect: 'sqlite', // Database အမျိုးအစား
 // driver: 'd1-http', // Cloudflare D1 နဲ့ ချိတ်မယ်
});