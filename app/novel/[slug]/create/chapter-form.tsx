"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ChevronLeft, Crown, Sparkles, Save } from "lucide-react";

// Editor Import
const Editor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
  loading: () => <div className="h-[70vh] animate-pulse bg-gray-50 rounded-lg"></div>
});

// ✅ Props Interface သတ်မှတ်ခြင်း (Edit အတွက် initialData ထပ်ဖြည့်ထားသည်)
interface ChapterFormProps {
  slug: string;
  novelId: number;
  suggestedIndex?: number;
  initialData?: {
    id: string;
    title: string;
    content: string;
    sortIndex: number;
    isPaid: boolean;
  };
  saveAction?: (formData: FormData) => Promise<void>; // Create mode အတွက် legacy support
}

export default function ChapterForm({ slug, novelId, suggestedIndex, initialData }: ChapterFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // ✅ Edit Mode ဖြစ်ရင် ရှိပြီးသား စာတွေကို Ref ထဲ ကြိုထည့်ထားမယ်
  const contentRef = useRef(initialData?.content || "");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const content = contentRef.current;
      const isPaid = formData.get("isPaid") === "on";
      const title = formData.get("title") as string;
      const sortIndex = formData.get("sortIndex");

      const endpoint = initialData ? '/api/novel/chapter/edit' : '/api/novel/chapter/create';
      const body = initialData
        ? formData
        : JSON.stringify({
          novelId,
          novelSlug: slug,
          title,
          content,
          sortIndex,
          isPaid
        });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: initialData ? {} : { 'Content-Type': 'application/json' },
        body: body,
      });

      const res = await response.json() as { success: boolean; sortIndex?: number; error?: string };
      if (res.success) {
        const finalSortIndex = res.sortIndex || sortIndex;
        router.push(`/novel/${slug}/${finalSortIndex}`);
        router.refresh();
      } else {
        alert(res.error || "Failed to save chapter");
      }
    } catch (error) {
      alert("An error occurred while saving the chapter");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="min-h-screen bg-white"
    >

      {/* ✅ Edit Mode ဆိုရင် ID ကို Hidden Input အနေနဲ့ ထည့်ပေးပေးရမယ် */}
      {initialData && <input type="hidden" name="chapterId" value={initialData.id} />}
      <input type="hidden" name="novelSlug" value={slug} />

      {/* ========================
          1. Top Navigation Bar 
         ======================== */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">

          {/* Left: Back & Chapter Info */}
          <div className="flex items-center gap-4">
            <Link
              href={`/novel/${slug}`}
              className="group flex items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium text-sm">Back</span>
            </Link>

            <div className="h-6 w-px bg-gray-200"></div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 font-medium uppercase tracking-wide text-xs">Order.No</span>
              <input
                name="sortIndex"
                type="number"
                // ✅ Edit ဆိုရင် အဟောင်းပြမယ်၊ New ဆိုရင် အသစ်ပြမယ်
                defaultValue={initialData?.sortIndex ?? suggestedIndex}
                step="0.1"
                className="w-16 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-transparent focus:border-gray-300 rounded px-2 py-1 font-bold text-gray-900 outline-none text-center transition-all"
                required
              />
            </div>
          </div>

          {/* Right: Premium & Publish */}
          <div className="flex items-center gap-6">

            {/* ✨ Premium Toggle Switch ✨ */}
            <label className="cursor-pointer flex items-center gap-3 group select-none">
              <div className="flex items-center gap-1.5 text-gray-500 group-hover:text-yellow-600 transition-colors">
                <Crown size={16} />
                <span className="text-sm font-medium">Premium</span>
              </div>

              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  name="isPaid"
                  className="sr-only peer"
                  // ✅ Edit Mode အတွက် defaultChecked ထည့်ပေးရမယ်
                  defaultChecked={initialData?.isPaid || false}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500 shadow-inner"></div>
              </div>
            </label>

            {/* 🚀 Publish / Save Button */}
            <button
              disabled={loading}
              type="submit"
              className="bg-slate-900 hover:bg-black text-white font-medium py-2.5 px-8 rounded-full shadow-lg shadow-gray-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>Saving...</>
              ) : (
                <>
                  {/* Edit Mode ဆို Save, New ဆို Publish ပြမယ် */}
                  <span>{initialData ? "Save Changes" : "Publish"}</span>
                  {initialData ? (
                    <Save size={16} className="text-gray-300" />
                  ) : (
                    <Sparkles size={16} className="text-yellow-400" />
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================
          2. Main Writing Area 
         ======================== */}
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">

        {/* Title Input */}
        <input
          name="title"
          type="text"
          // ✅ Edit Mode အတွက် defaultValue
          defaultValue={initialData?.title}
          placeholder="Chapter Title"
          className="w-full text-3xl font-extrabold placeholder-gray-200 border-none outline-none focus:ring-0 p-0 bg-transparent leading-tight font-serif tracking-tight text-gray-900"
          autoFocus
          required
          autoComplete="off"
        />

        {/* Editor Area */}
        <div className="min-h-[70vh]">
          {/* ⚠️ Editor Component မှာ initialContent (သို့) defaultValue လက်ခံအောင် ပြင်ထားဖို့ လိုပါတယ် */}
          <Editor
            initialContent={initialData?.content} // ဒါလေး ထပ်ဖြည့်ပေးလိုက်တယ်
            onChange={(html: string) => {
              contentRef.current = html;
            }}
          />
        </div>
      </div>

    </form>
  );
}