import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";

// Cache the auth instance globally for the worker isolate to save CPU time.
// Re-initializing betterAuth on every request consumes a lot of CPU ms (schema parsing, etc).
let authInstance: ReturnType<typeof betterAuth> | null = null;

export const createAuth = (dbBinding: D1Database) => {
  if (authInstance) return authInstance;

  authInstance = betterAuth({
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

  return authInstance;
};