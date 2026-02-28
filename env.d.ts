import type { D1Database } from "@cloudflare/workers-types";

declare global {
  interface CloudflareEnv {
    // wrangler.toml ထဲမှာ binding = "DB" လို့ ပေးခဲ့ရင် ဒီမှာလည်း DB ဖြစ်ရပါမယ်
    DB: D1Database;
    R2_BUCKET: R2Bucket;
    ADMIN_SECRET_KEY?: string;
  }
}