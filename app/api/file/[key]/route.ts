import { getRequestContext } from "@cloudflare/next-on-pages";
import type { NextRequest } from "next/server";

export const runtime = 'edge';

export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { env } = getRequestContext();
  const { key } = await params;

  if (!env.R2_BUCKET) {
    return new Response("R2 Bucket not configured", { status: 500 });
  }

  // R2 Bucket ထဲမှာ ပုံရှိမရှိ ရှာမယ်
  const object = await env.R2_BUCKET.get(key);

  if (!object) {
    return new Response("Image Not Found", { status: 404 });
  }

  // Browser က ပုံမှန်းသိအောင် Header သတ်မှတ်ပေးမယ်
  const headers = new Headers();
  
  if (object.httpMetadata?.contentType) {
    headers.set("Content-Type", object.httpMetadata.contentType);
  }
  if (object.size) {
    headers.set("Content-Length", object.size.toString());
  }
  
  // ETag နဲ့ Cache Control ထည့်မယ်
  headers.set("ETag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000"); // Cache ၁ နှစ် ထားမယ်

  return new Response(object.body, {
    headers,
  });
}