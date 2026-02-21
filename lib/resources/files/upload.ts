"use server";

import { getRequestContext } from "@cloudflare/next-on-pages";

export async function uploadImage(formData: FormData) {
  const file = formData.get("file") as File;
  
  if (!file) {
    throw new Error("ပုံ မပါပါဘူး");
  }

  const { env } = getRequestContext();
  
  // ဖိုင်နာမည် မထပ်အောင် ရှေ့က random နံပါတ်တစ်ခု ခံပေးလိုက်မယ်
  const fileName = `${crypto.randomUUID()}-${file.name}`;

  // File ကို ArrayBuffer ပြောင်းပြီး R2 ထဲ ထည့်မယ်
  const arrayBuffer = await file.arrayBuffer();

  await env.R2_BUCKET.put(fileName, arrayBuffer, {
    httpMetadata: {
      contentType: file.type, // image/png, image/jpeg စသည်ဖြင့် မှတ်ထားမယ်
    },
  });

  // ပုံလမ်းကြောင်း (URL) ကို ပြန်ပို့ပေးမယ်
  return `/api/file/${fileName}`;
}