'use client';

import { useEffect, useRef } from 'react';
import { incrementView } from '../actions'; // Action လမ်းကြောင်း မှန်ပါစေ

export default function ViewTracker({ slug }: { slug: string }) {
  const hasViewed = useRef(false); // ၂ ခါ မတိုးအောင် ကာကွယ်မယ်

  useEffect(() => {
    console.log("[TRACKER] Starting timer for:", slug);
    const timer = setTimeout(() => {
      if (!hasViewed.current) {
        console.log("[TRACKER] Triggering incrementView for:", slug);
        incrementView(slug).catch(err => console.error("[TRACKER] Error:", err));
        hasViewed.current = true;
      }
    }, 1000); 

    return () => clearTimeout(timer); // ၅ စက္ကန့် မပြည့်ခင် ပြန်ထွက်သွားရင် View မတိုးဘူး
  }, [slug]);

  return null; // UI မှာ ဘာမှ မပြဘူး
}