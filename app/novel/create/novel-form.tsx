'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ✅ Props လက်ခံနိုင်အောင် Interface ဆောက်လိုက်ပါတယ်
interface NovelFormProps {
  initialData?: {
    id: string;
    title: string;
    englishTitle: string;
    description: string | null;
    coverUrl: string | null;
    tags?: string | null;
  };
  action?: (formData: FormData) => void; // Create mode အတွက် legacy support
  submitLabel?: string;
}

export default function NovelForm({
  initialData,
  submitLabel = "Create Novel"
}: NovelFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(initialData?.coverUrl || null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!initialData) return; // Only handle edit mode here for now

    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch('/api/novel/edit', {
        method: 'POST',
        body: formData,
      });

      const res = await response.json() as { success: boolean; slug?: string; error?: string };
      if (res.success && res.slug) {
        router.push(`/novel/${res.slug}`);
        router.refresh();
      } else {
        alert(res.error || "Failed to update novel");
      }
    } catch (error) {
      alert("An error occurred while updating the novel");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  };

  return (
    <form
      onSubmit={initialData ? handleSubmit : undefined}
      action={!initialData ? "/api/novel/create" : undefined} // TODO: Create API route if needed
      method="POST"
      className="space-y-6 bg-[var(--surface)] p-8 rounded-2xl shadow-sm border border-[var(--border)]"
    >

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
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-bold text-[var(--foreground)]">English Title (URL Slug)</label>
          <span className={`text-[11px] font-medium ${(initialData?.englishTitle?.length || 0) > 100 ? 'text-red-500' : 'text-[var(--text-muted)]'
            }`}>
            {initialData?.englishTitle?.length || 0} / 100
          </span>
        </div>
        <input
          name="englishTitle"
          required
          defaultValue={initialData?.englishTitle}
          placeholder="e.g. solo-leveling"
          onChange={(e) => {
            const count = e.target.value.length;
            const counter = e.target.previousElementSibling?.querySelector('span');
            if (counter) {
              counter.textContent = `${count} / 100`;
              if (count > 100) {
                counter.classList.add('text-red-500');
                counter.classList.remove('text-[var(--text-muted)]');
              } else {
                counter.classList.remove('text-red-500');
                counter.classList.add('text-[var(--text-muted)]');
              }
            }
          }}
          className="w-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] px-4 py-3 rounded-xl focus:ring-2 focus:ring-[var(--action)] focus:border-transparent outline-none transition-shadow"
        />
        <p className="text-[11px] text-[var(--text-muted)] mt-1 pl-1">
          * စာလုံးရေ ၁၀၀ ထက် ကျော်သွားပါက Slug ကို အလိုလို ဖြတ်တောက်ပါမည်။
        </p>
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full sm:w-auto px-8 py-2.5 rounded-xl font-bold transition-transform active:scale-95 text-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>

    </form>
  );
}