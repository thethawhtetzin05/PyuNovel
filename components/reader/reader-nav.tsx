'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ReaderNav({ novelTitle, novelSlug, chapterIndex }: { novelTitle: string, novelSlug: string, chapterIndex: number }) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // အောက်ကို 50px ထက်ကျော်ဆွဲရင် ဖျောက်မယ်
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    // translate-y-full ကိုသုံးပြီး အပေါ်ကို လျှောတက်/ဆင်းအောင် လုပ်ထားပါတယ်
    <div className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-md border-b border-black/10 px-4 md:px-6 py-3 flex justify-between items-center w-full transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
       <Link 
          href={`/novel/${novelSlug}`} 
          className="text-indigo-500 font-bold text-sm hover:underline flex items-center gap-1"
       >
          ← {novelTitle}
       </Link>
       <span className="text-xs font-bold opacity-50 uppercase tracking-wider">
          Chapter {chapterIndex}
       </span>
    </div>
  );
}