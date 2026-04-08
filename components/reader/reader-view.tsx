'use client';

import { useState, useEffect } from 'react';
import { List, ChevronLeft, ChevronRight, Settings, Minus, Plus, Sun, Moon, Monitor, ArrowLeft } from 'lucide-react';
import ParagraphReader from './ParagraphReader';
import { Link } from '@/i18n/routing';
import { useTheme } from 'next-themes';
import AdUnit from '../ads/AdUnit';

interface ReaderViewProps {
  content: string;
  chapterId: string;
  allChapters: any[];
  novelSlug: string;
  novelTitle: string;
  title: string;
  date: string;
  prevIndex: string | null;
  nextIndex: string | null;
}

export default function ReaderView({ content, chapterId, allChapters, novelSlug, novelTitle, title, date, prevIndex, nextIndex }: ReaderViewProps) {
  const { theme, setTheme } = useTheme();
  const [fontSize, setFontSize] = useState(18);
  const [showSettings, setShowSettings] = useState(false);
  const [cleanContent, setCleanContent] = useState(content);
  const [isBarVisible, setIsBarVisible] = useState(true);

  useEffect(() => {
    const handleToggleBar = (e: any) => {
      // Don't toggle if clicking on interactive elements
      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('.fixed') // This covers our floating bar/settings
      ) {
        return;
      }

      setIsBarVisible(prev => !prev);
    };

    document.addEventListener('click', handleToggleBar);
    return () => document.removeEventListener('click', handleToggleBar);
  }, []);

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

  const toggleTOC = () => {
    window.dispatchEvent(new CustomEvent('open-toc-sidebar'));
  };

  return (
    // 💡 မျက်နှာပြင်အပြည့် (w-full) ဖြစ်ပါတယ်။ နောက်ခံအရောင်တွေ လုံးဝ မရေးထားတော့ပါဘူး။ 
    <div className="w-full pb-32 pt-0 select-none">

      <div
        className="w-full max-w-5xl mx-auto px-5 sm:px-8 md:px-12 font-serif leading-relaxed text-justify md:text-left chapter-content-wrapper"
        style={{ fontSize: `${fontSize}px` }}
        onCopy={(e) => { e.preventDefault(); return false; }}
        onContextMenu={(e) => { e.preventDefault(); return false; }}
      >
        <div className="mb-8 border-b border-current opacity-70 pb-6 flex flex-col items-start gap-2">
          <Link
            href={`/novel/${novelSlug}`}
            className="md:hidden p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
            title="Back to Novel"
          >
            <ArrowLeft size={24} />
          </Link>
          <div className="w-full text-center">
            <h1 className="text-2xl md:text-3xl font-black leading-tight">
              {title}
            </h1>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
          .chapter-content-wrapper p { margin-bottom: 2em; position: relative; }
          .chapter-content-wrapper h1, .chapter-content-wrapper h2 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: bold; }
          .chapter-content-wrapper h3, .chapter-content-wrapper h4 { margin-top: 1.25em; margin-bottom: 0.5em; font-weight: bold; }
        `}} />
        <ParagraphReader
          content={cleanContent}
          chapterId={chapterId}
          allChapters={allChapters}
          novelSlug={novelSlug}
          novelTitle={novelTitle}
        />
        {/* CHAPTER END AD */}
        <AdUnit type="300x250" />
      </div>

      {/* Floating Bottom Navigation Bar (Mobile Only) */}
      <div
        className={`md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 transform ${isBarVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'
          }`}
      >
        <div className="flex items-center gap-1 p-2 bg-background/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-border dark:border-white/10 text-foreground">
          {/* Previous Button */}
          {prevIndex ? (
            <Link href={`/novel/${novelSlug}/${prevIndex}`} className="p-3 hover:bg-muted dark:hover:bg-white/5 rounded-xl transition-colors">
              <ChevronLeft size={22} strokeWidth={2} />
            </Link>
          ) : (
            <div className="p-3 opacity-20"><ChevronLeft size={22} /></div>
          )}

          <div className="w-px h-6 bg-border dark:bg-white/10 mx-1" />

          {/* Table of Contents */}
          <button onClick={toggleTOC} className="p-3 hover:bg-muted dark:hover:bg-white/5 rounded-xl transition-colors">
            <List size={22} strokeWidth={2} />
          </button>

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-3 hover:bg-muted dark:hover:bg-white/5 rounded-xl transition-colors ${showSettings ? 'bg-indigo-600 text-white' : ''}`}
          >
            <Settings size={22} strokeWidth={2} />
          </button>

          <div className="w-px h-6 bg-border dark:bg-white/10 mx-1" />

          {/* Next Button */}
          {nextIndex ? (
            <Link href={`/novel/${novelSlug}/${nextIndex}`} className="p-3 bg-indigo-600 text-white rounded-xl transition-colors shadow-lg shadow-indigo-600/20 hover:bg-indigo-700">
              <ChevronRight size={22} strokeWidth={2.5} />
            </Link>
          ) : (
            <div className="p-3 opacity-20"><ChevronRight size={22} /></div>
          )}
        </div>

        {/* Font Size & Theme Settings Box - Absolute above the bar */}
        {showSettings && (
          <div className="absolute bottom-[110%] left-1/2 -translate-x-1/2 w-72 bg-background/95 dark:bg-slate-900/95 backdrop-blur-xl text-foreground rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-border dark:border-white/10 p-5 animate-in slide-in-from-bottom-5 fade-in">
            <ThemeAndFontSettings theme={theme} setTheme={setTheme} fontSize={fontSize} updateFontSize={updateFontSize} />
          </div>
        )}
      </div>

      {/* Desktop Floating Settings Only */}
      <div className="hidden md:block fixed bottom-6 right-6 z-[100]">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-4 bg-background/80 dark:bg-slate-900/80 backdrop-blur-md rounded-full shadow-lg border border-border dark:border-white/10 text-foreground hover:scale-110 transition-all active:scale-95 ${showSettings ? 'bg-indigo-600 text-white border-indigo-500' : ''}`}
        >
          <Settings size={24} />
        </button>

        {showSettings && (
          <div className="absolute bottom-16 right-0 w-72 bg-background/95 dark:bg-slate-900/95 backdrop-blur-xl text-foreground rounded-2xl shadow-xl border border-border dark:border-white/10 p-5 animate-in slide-in-from-bottom-5 fade-in">
            <ThemeAndFontSettings theme={theme} setTheme={setTheme} fontSize={fontSize} updateFontSize={updateFontSize} />
          </div>
        )}
      </div>

    </div>
  );
}

// Sub-component for shared settings UI
function ThemeAndFontSettings({ theme, setTheme, fontSize, updateFontSize }: any) {
  return (
    <>
      {/* Theme Toggle */}
      <div className="mb-6">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-3">Reading Mode</span>
        <div className="flex items-center gap-1 bg-muted dark:bg-slate-800/50 p-1 rounded-xl">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 rounded-lg transition-all ${theme === 'light' ? 'bg-background shadow-sm border-border' : 'opacity-40 hover:opacity-100'}`}
          >
            <Sun size={16} />
            <span className="text-[9px] font-bold">Light</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 rounded-lg transition-all ${theme === 'dark' ? 'bg-background shadow-sm border-border' : 'opacity-40 hover:opacity-100'}`}
          >
            <Moon size={16} />
            <span className="text-[9px] font-bold">Dark</span>
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 rounded-lg transition-all ${theme === 'system' ? 'bg-background shadow-sm border-border' : 'opacity-40 hover:opacity-100'}`}
          >
            <Monitor size={16} />
            <span className="text-[9px] font-bold">Auto</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Font Size</span>
        <span className="font-bold text-xs">{fontSize}px</span>
      </div>
      <div className="flex items-center gap-2 bg-muted dark:bg-slate-800/50 p-1 rounded-xl">
        <button onClick={() => updateFontSize(Math.max(14, fontSize - 2))} className="flex-1 h-10 flex items-center justify-center hover:bg-background dark:hover:bg-slate-700 rounded-lg transition-all active:scale-90 shadow-sm border border-transparent hover:border-border"><Minus size={18} /></button>
        <div className="w-px h-6 bg-border dark:bg-white/10" />
        <button onClick={() => updateFontSize(Math.min(32, fontSize + 2))} className="flex-1 h-10 flex items-center justify-center hover:bg-background dark:hover:bg-slate-700 rounded-lg transition-all active:scale-90 shadow-sm border border-transparent hover:border-border"><Plus size={18} /></button>
      </div>
    </>
  );
}
