import { createAuth } from "@/lib/auth"; // auth အစား createAuth ကို သုံးပါ
import { toNextJsHandler } from "better-auth/next-js";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextRequest } from "next/server";

export const runtime = "edge";

// Request တစ်ခုချင်းစီအတွက် Handler ဖန်တီးပါ
async function handler(req: NextRequest) {
  // ၁။ Context ကနေ Database (env.DB) ကို ယူပါ
  const { env } = getRequestContext();
  
  // ၂။ Database ရမှ Auth ကို တည်ဆောက်ပါ
  const auth = createAuth(env.DB);
  
  // ၃။ Better Auth ရဲ့ Handler ကို ခေါ်သုံးပါ
  const { POST, GET } = toNextJsHandler(auth);
  
  if (req.method === "POST") {
    return POST(req);
  }
  return GET(req);
}

export { handler as GET, handler as POST };