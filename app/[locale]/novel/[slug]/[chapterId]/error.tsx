'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { getChapterOffline } from '@/lib/mobile-db';
import { useParams } from 'next/navigation';
import ReaderView from '@/components/reader/reader-view';
import { Link } from '@/i18n/routing';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const chapterId = params.chapterId as string;
  const slug = params.slug as string;

  const [offlineData, setOfflineData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // အကယ်၍ Native App ဖြစ်ပြီး Error တက်တယ်ဆိုရင် Offline DB ကို စစ်မယ်
    if (Capacitor.isNativePlatform()) {
      const checkOffline = async () => {
        try {
          const data = await getChapterOffline(chapterId);
          if (data) {
            setOfflineData(data);
          }
        } catch (e) {
          console.error("Failed to load offline data", e);
        } finally {
          setLoading(false);
        }
      };
      checkOffline();
    } else {
      setLoading(false);
    }
  }, [chapterId]);

  if (offlineData) {
    const formattedDate = new Date(offlineData.saved_at || Date.now()).toLocaleDateString();

    // Offline Content ကို HTML ပုံစံ ပြန်ဖွဲ့စည်းမယ်
    const htmlContent = `
         <div class="mb-12 px-4 md:px-0 border-b border-current opacity-70 pb-6 text-center md:text-left">
           <h1 class="text-3xl md:text-4xl font-black mt-2 mb-3 leading-tight text-inherit">
               ${offlineData.title}
           </h1>
           <div class="flex items-center justify-center md:justify-start gap-2 text-inherit opacity-60 text-sm font-sans">
               <span>${formattedDate}</span>
               <span class="bg-yellow-500/20 text-yellow-600 px-2 py-0.5 rounded text-xs font-bold">OFFLINE MODE</span>
           </div>
         </div>
         
         <div class="chapter-content">
           ${offlineData.content}
         </div>
     `;

    return (
      <div className="min-h-screen w-full flex flex-col pb-12">
        {/* TOP NAV */}
        <div className="w-full max-w-5xl mx-auto px-5 sm:px-8 md:px-12 py-4 flex justify-between items-center opacity-70">
          <Link href={`/novel/${slug}`} className="font-bold text-sm hover:underline flex items-center gap-1">
            ← {offlineData.novel_title}
          </Link>
        </div>

        {/* READER */}
        <div className="flex-grow w-full">
          <ReaderView
            content={htmlContent}
            chapterId={chapterId}
            allChapters={[]}
            novelSlug={slug}
          />
        </div>

        {/* FOOTER NAV */}
        <div className="w-full max-w-5xl mx-auto px-5 sm:px-8 md:px-12 py-8 mt-12 border-t border-current opacity-70">
          <div className="flex justify-between items-center gap-4">
            {offlineData.prev_chapter_id ? (
              <Link href={`/novel/${slug}/${offlineData.prev_chapter_id}`} className="px-6 py-3 rounded-xl font-bold border border-current hover:opacity-100 opacity-80">← Prev</Link>
            ) : <div />}

            {offlineData.next_chapter_id ? (
              <Link href={`/novel/${slug}/${offlineData.next_chapter_id}`} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold">Next →</Link>
            ) : (
              <Link href={`/novel/${slug}`} className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold">Finish</Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Offline Data မရှိရင် ပုံမှန် Error ပြမယ်
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-gray-500 mb-6">{error.message || "Failed to load chapter."}</p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
