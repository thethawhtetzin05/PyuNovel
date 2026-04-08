'use client';

import { useEffect, useRef } from 'react';

export default function ViewTracker({ slug, chapterId }: { slug: string, chapterId?: string }) {
  const hasViewed = useRef(false); // ၂ ခါ မတိုးအောင် ကာကွယ်မယ်

  useEffect(() => {
    console.log("[TRACKER] Starting timer for:", slug, "chapter:", chapterId);
    const timer = setTimeout(async () => {
      if (!hasViewed.current) {
        try {
          console.log("[TRACKER] Calling /api/novel/view for:", slug, "chapter:", chapterId);
          const res = await fetch('/api/novel/view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, chapterId }),
          });
          const data = await res.json() as { success: boolean; error?: string };
          if (data.success) {
            console.log("[TRACKER] View incremented for:", slug);
          } else {
            console.error("[TRACKER] Server error:", data.error);
          }
        } catch (err) {
          console.error("[TRACKER] Fetch error:", err);
        }
        hasViewed.current = true;
      }
    }, 1000); // ၁ စက္ကန့် ကြာမှ တိုး (မကြာမီ ထွက်သွားရင် view မတိုးဘူး)

    return () => clearTimeout(timer);
  }, [slug, chapterId]);

  return null; // UI မှာ ဘာမှ မပြဘူး
}