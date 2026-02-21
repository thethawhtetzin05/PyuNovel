'use client';

import { useState } from 'react';
import Link from 'next/link';

// ✅ Props လက်ခံနိုင်အောင် Interface ဆောက်လိုက်ပါတယ်
interface NovelFormProps {
  initialData?: {
    id: string;
    title: string;
    englishTitle: string;
    description: string | null;
    coverUrl: string | null;
    tags?: string | null; // 👈 Edit လုပ်တဲ့အခါ Tag အဟောင်းတွေ ပြန်ပေါ်အောင် ထည့်ထားပါသည်
  };
  action: (formData: FormData) => void; // Server Action ကို အပြင်ကနေ လှမ်းပို့ရမယ်
  submitLabel?: string; // ခလုတ်စာသား (Create Novel vs Save Changes)
}

export default function NovelForm({
  initialData,
  action,
  submitLabel = "Create Novel"
}: NovelFormProps) {

  // Preview ကို initialData ရှိရင် ရှိတဲ့ပုံပြမယ်၊ မရှိရင် null
  const [preview, setPreview] = useState<string | null>(initialData?.coverUrl || null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  };

  return (
    // ✅ action prop ကို သုံးထားပါတယ် (createNovelAction တိုက်ရိုက်မခေါ်တော့ပါ)
    <form action={action} className="space-y-6 bg-[var(--surface)] p-8 rounded-2xl shadow-sm border border-[var(--border)]">

      {/* ✅ Edit Mode ဆိုရင် ID နဲ့ Old Image URL ကို Hidden Input အနေနဲ့ ထည့်ပေးရမယ် */}
      {initialData && (
        <>
          <input type="hidden" name="novelId" value={initialData.id} />
          <input type="hidden" name="oldImageUrl" value={initialData.coverUrl || ""} />
        </>
      )}

      {/* Cover Image Area */}
      <div>
        <label className="block text-sm font-bold text-[var(--foreground)] mb-1">
          Cover Image
        </label>

        <label
          htmlFor="cover-upload"
          className="mt-1 relative flex flex-col justify-center px-4 pt-5 pb-6 border-2 border-[var(--border)] border-dashed rounded-xl hover:border-[var(--action)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer w-48 mx-auto sm:w-56 aspect-[2/3] items-center overflow-hidden bg-[var(--surface-2)]"
        >
          {preview ? (
            <img
              src={preview}
              alt="Cover Preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="space-y-1 text-center flex flex-col items-center">
              <svg className="mx-auto h-10 w-10 text-[var(--text-muted)]" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-sm">
                <span className="font-semibold text-[var(--action)]">
                  Upload cover
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">PNG, JPG</p>
            </div>
          )}

          <input
            id="cover-upload"
            name="coverImage"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleImageChange}
          />
        </label>
      </div>

      {/* Novel Title */}
      <div>
        <label className="block text-sm font-bold text-[var(--foreground)] mb-1">Novel Title</label>
        <input
          name="title"
          required
          defaultValue={initialData?.title}
          placeholder="Your Novel Title"
          className="w-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] px-4 py-3 rounded-xl focus:ring-2 focus:ring-[var(--action)] focus:border-transparent outline-none transition-shadow"
        />
      </div>

      {/* English Title */}
      <div>
        <label className="block text-sm font-bold text-[var(--foreground)] mb-1">English Title (URL Slug)</label>
        <input
          name="englishTitle"
          required
          defaultValue={initialData?.englishTitle}
          placeholder="e.g. solo-leveling"
          className="w-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] px-4 py-3 rounded-xl focus:ring-2 focus:ring-[var(--action)] focus:border-transparent outline-none transition-shadow"
        />
      </div>

      {/* 👇 Tags (အသစ်ထည့်ထားသော အပိုင်း) */}
      <div>
        <label className="block text-sm font-bold text-[var(--foreground)] mb-1">Tags</label>
        <input
          name="tags"
          defaultValue={initialData?.tags || ""}
          placeholder="e.g. Action, Romance, Fantasy (Separate with commas)"
          className="w-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] px-4 py-3 rounded-xl focus:ring-2 focus:ring-[var(--action)] focus:border-transparent outline-none transition-shadow"
        />
        <p className="text-[11px] text-[var(--text-muted)] mt-1 pl-1 font-medium">
          * အမျိုးအစားများကို ကော်မာ ( , ) ခြားပြီး ရေးပေးပါ။
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-bold text-[var(--foreground)] mb-1">Synopsis</label>
        <textarea
          name="description"
          rows={5}
          defaultValue={initialData?.description || ""}
          placeholder="Story description..."
          className="w-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] px-4 py-3 rounded-xl focus:ring-2 focus:ring-[var(--action)] focus:border-transparent outline-none transition-shadow"
        />
      </div>

      <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3">
        {/* Cancel နှိပ်ရင် Edit Mode ဆို မူရင်း Novel ဆီပြန်မယ်၊ Create Mode ဆို Home ပြန်မယ် */}
        <Link
          href={initialData ? `/novel/${initialData.englishTitle}` : "/"}
          className="px-6 py-2.5 rounded-xl font-medium text-[var(--text-muted)] hover:bg-[var(--surface-2)] flex items-center justify-center transition"
        >
          Cancel
        </Link>

        <button type="submit" className="btn-primary w-full sm:w-auto px-8 py-2.5 rounded-xl font-bold transition-transform active:scale-95 text-center">
          {submitLabel}
        </button>
      </div>

    </form>
  );
}