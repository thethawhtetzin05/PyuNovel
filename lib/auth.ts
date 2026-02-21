import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";

// ⚠️ auth variable အစား Function ပြောင်းလိုက်ပါ
export const createAuth = (dbBinding: D1Database) => {
  return betterAuth({
    database: drizzleAdapter(drizzle(dbBinding), {
      provider: "sqlite",
      schema: schema,
    }),
    emailAndPassword: {
      enabled: true,
    },
    user: {
      additionalFields: {
        role: { type: "string", defaultValue: "reader" },
        coins: { type: "number", defaultValue: 0 }
      }
    }
  });
};