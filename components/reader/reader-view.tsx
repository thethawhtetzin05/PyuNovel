'use client';

import { useState, useEffect } from 'react';
import { Settings, Minus, Plus } from 'lucide-react';
import ParagraphReader from './ParagraphReader';

interface ReaderViewProps {
  content: string;
  chapterId: string;
  allChapters: any[];
  novelSlug: string;
}

export default function ReaderView({ content, chapterId, allChapters, novelSlug }: ReaderViewProps) {
  const [fontSize, setFontSize] = useState(18);
  const [showSettings, setShowSettings] = useState(false);
  const [cleanContent, setCleanContent] = useState(content);

  useEffect(() => {
    // Font Size ကိုပဲ သိမ်းတော့မယ်
    const savedSettings = localStorage.getItem('reader-font-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setFontSize(parsed.fontSize);
    }

    // Dynamic import to avoid SSR errors in Edge runtime
    const sanitizeContent = async () => {
      try {
        const DOMPurify = (await import('isomorphic-dompurify')).default;
        setCleanContent(DOMPurify.sanitize(content));
      } catch (e) {
        console.error("Sanitization error:", e);
      }
    };

    sanitizeContent();
  }, [content]);

  const updateFontSize = (newSize: number) => {
    setFontSize(newSize);
    localStorage.setItem('reader-font-settings', JSON.stringify({ fontSize: newSize }));
  };

  return (
    // 💡 မျက်နှာပြင်အပြည့် (w-full) ဖြစ်ပါတယ်။ နောက်ခံအရောင်တွေ လုံးဝ မရေးထားတော့ပါဘူး။ 
    // Website ရဲ့ Global Theme အရောင်က အလိုလို ဒီနေရာကို လာသက်ရောက်သွားမှာပါ။
    <div className="w-full pb-8 pt-2 md:pt-4">

      {/* စာသားများကို အလယ်တွင် သေသပ်စွာ ရှိနေစေရန် - prose ဖြင့် လှပစွာ ချိန်ညှိထားသည် */}
      <div
        className="w-full max-w-5xl mx-auto px-5 sm:px-8 md:px-12 font-serif leading-relaxed text-justify md:text-left chapter-content-wrapper select-none"
        style={{ fontSize: `${fontSize}px` }}
        onCopy={(e) => { e.preventDefault(); return false; }}
        onContextMenu={(e) => { e.preventDefault(); return false; }}
      >
        <style dangerouslySetInnerHTML={{
          __html: `
          .chapter-content-wrapper p { margin-bottom: 1.5em; position: relative; }
          .chapter-content-wrapper h1, .chapter-content-wrapper h2 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: bold; }
          .chapter-content-wrapper h3, .chapter-content-wrapper h4 { margin-top: 1.25em; margin-bottom: 0.5em; font-weight: bold; }
        `}} />
        <ParagraphReader
          content={cleanContent}
          chapterId={chapterId}
          allChapters={allChapters}
          novelSlug={novelSlug}
        />
      </div>

      {/* Settings အဖွင့်/အပိတ် ခလုတ် */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-transform active:scale-95 border-none"
        >
          <Settings size={24} />
        </button>

        {/* Font Size Settings Box */}
        {showSettings && (
          // 💡 Dark Mode ရောက်ရင် Settings Box လေးပါ အမဲရောင်ပြောင်းသွားအောင် dark: class များ ထည့်ထားပါတယ်
          <div className="absolute bottom-16 right-0 w-72 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-5 animate-in slide-in-from-bottom-5 fade-in">

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Font Size</label>
              <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button onClick={() => updateFontSize(Math.max(14, fontSize - 2))} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors w-full flex justify-center"><Minus size={16} /></button>
                <span className="font-bold text-sm min-w-[3rem] text-center">{fontSize}px</span>
                <button onClick={() => updateFontSize(Math.min(32, fontSize + 2))} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors w-full flex justify-center"><Plus size={16} /></button>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}