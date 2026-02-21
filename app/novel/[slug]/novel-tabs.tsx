'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Crown, ChevronRight, Calendar } from 'lucide-react';
import { deleteChapterAction } from './[chapterId]/actions';

interface Chapter {
  id: string;
  title: string;
  sortIndex: number;
  isPaid: boolean;
  createdAt: string | Date | null;
}

interface NovelTabsProps {
  novelSlug: string;
  novelId: string;
  description: string;
  chapters: Chapter[];
  isOwner?: boolean;
}

export default function NovelTabs({
  novelSlug,
  description,
  chapters,
  isOwner = false
}: NovelTabsProps) {

  const [activeTab, setActiveTab] = useState<'about' | 'chapters'>('about');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, chapterId: string) => {
    e.preventDefault();
    // e.stopPropagation(); // Link ထဲမှာ မဟုတ်တော့လို့ ဒါမလိုတော့ပါဘူး

    if (confirm("Are you sure you want to delete this chapter? This action cannot be undone.")) {
      setIsDeleting(chapterId);
      try {
        await deleteChapterAction(chapterId, novelSlug);
      } catch (error) {
        alert("Failed to delete chapter");
      } finally {
        setIsDeleting(null);
      }
    }
  };

  return (
    <div className="mt-8">

      {/* 1. Tab Headers */}
      <div className="flex gap-8 border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab('about')}
          className={`pb-4 text-xl font-bold transition-all relative ${activeTab === 'about' ? 'text-[var(--foreground)]' : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
        >
          About
          {activeTab === 'about' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[var(--action)] rounded-t-full"></div>}
        </button>

        <button
          onClick={() => setActiveTab('chapters')}
          className={`pb-4 text-xl font-bold transition-all relative flex items-center gap-2 ${activeTab === 'chapters' ? 'text-[var(--foreground)]' : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
        >
          Chapters
          <span className="text-xs bg-[var(--surface-2)] text-[var(--foreground)] px-2.5 py-0.5 rounded-full border border-[var(--border)] font-extrabold">
            {chapters.length}
          </span>
          {activeTab === 'chapters' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[var(--action)] rounded-t-full"></div>}
        </button>
      </div>

      {/* 2. Content Area */}
      <div>

        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-[17px] leading-8 text-[var(--text-muted)] whitespace-pre-line text-justify md:text-left font-serif">
              {description || "No synopsis available."}
            </p>
          </div>
        )}

        {/* CHAPTERS TAB */}
        {activeTab === 'chapters' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-3">

            {chapters.length > 0 ? (
              chapters.map((chapter) => (
                // ✅ ပြင်ဆင်ချက် ၁: အပြင်ဆုံး Link ကို div သို့ ပြောင်းလိုက်သည်
                <div
                  key={chapter.id}
                  className={`group relative flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--action)]/50 hover:shadow-lg transition-all ${isDeleting === chapter.id ? "opacity-50 pointer-events-none" : ""
                    }`}
                >

                  {/* ✅ ပြင်ဆင်ချက် ၂: စာဖတ်ဖို့အတွက် သီးသန့် Link (flex-1 ပေးထားရင် နေရာအများဆုံးယူမယ်) */}
                  <Link
                    href={`/novel/${novelSlug}/${chapter.sortIndex}`}
                    className="flex-1 flex items-center gap-4 min-w-0 cursor-pointer"
                  >
                    {/* Number Badge */}
                    <span className="text-sm font-bold text-[var(--text-muted)] bg-[var(--surface-2)] px-3 py-1.5 rounded-lg min-w-[3.5rem] text-center group-hover:bg-[var(--action)]/10 group-hover:text-[var(--action)] transition-colors border border-[var(--border)]">
                      #{chapter.sortIndex}
                    </span>

                    {/* Title & Date */}
                    <div className="min-w-0">
                      <h4 className="font-bold text-[var(--foreground)] group-hover:text-[var(--action)] transition-colors text-lg truncate pr-4">
                        {chapter.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-1">
                        <Calendar size={12} />
                        <span>{new Date(chapter.createdAt || new Date()).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>

                  {/* Right Side Icons (Link အပြင်ဘက်သို့ ထုတ်လိုက်သည်) */}
                  <div className="flex items-center gap-3 shrink-0 pl-4 border-l border-[var(--border)] ml-4">

                    {/* 👑 VIP Badge */}
                    {chapter.isPaid && (
                      <div className="flex items-center gap-1 text-[var(--accent)] bg-[var(--accent)]/10 px-2.5 py-1 rounded-full text-xs font-bold border border-[var(--accent)]/30">
                        <Crown size={12} fill="currentColor" />
                        <span>VIP</span>
                      </div>
                    )}

                    {/* 🛠️ OWNER TOOLS (Edit/Delete) */}
                    {isOwner && (
                      <div className="flex items-center gap-2">

                        {/* Edit Button - Link သီးသန့် */}
                        <Link
                          href={`/novel/${novelSlug}/chapter/${chapter.id}/edit`}
                          className="p-2 text-[var(--text-muted)] hover:text-[var(--action)] hover:bg-[var(--surface-2)] rounded-full transition-colors"
                          title="Edit Chapter"
                        >
                          <Pencil size={18} />
                        </Link>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDelete(e, chapter.id)}
                          className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                          title="Delete Chapter"
                          disabled={isDeleting === chapter.id}
                        >
                          {isDeleting === chapter.id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Arrow Icon */}
                    {!isOwner && (
                      <Link href={`/novel/${novelSlug}/${chapter.sortIndex}`}>
                        <ChevronRight className="text-[var(--text-muted)] group-hover:text-[var(--action)] transition-colors" size={20} />
                      </Link>
                    )}

                  </div>
                </div>
              ))
            ) : (
              <div className="bg-[var(--surface-2)] rounded-xl p-12 text-center border-2 border-dashed border-[var(--border)]">
                <p className="text-[var(--text-muted)] font-medium text-lg">No chapters uploaded yet.</p>
                <span className="text-[var(--text-muted)] opacity-60 text-sm mt-2 block">New chapters coming soon!</span>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}