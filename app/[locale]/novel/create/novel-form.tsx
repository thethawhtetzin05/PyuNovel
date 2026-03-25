'use client';

import { useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

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
  submitLabel
}: NovelFormProps) {
  const router = useRouter();
  const t = useTranslations('NovelForm');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(initialData?.coverUrl || null);
  const finalSubmitLabel = submitLabel || (initialData ? t('saveChanges') : t('createNovel'));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const englishTitle = formData.get('englishTitle') as string;

    // Custom Validation
    const newErrors: Record<string, string> = {};
    if (!title?.trim()) newErrors.title = t('requiredField');
    if (!englishTitle?.trim()) newErrors.englishTitle = t('requiredField');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to first error for accessibility
      const firstErrorKey = Object.keys(newErrors)[0];
      document.getElementsByName(firstErrorKey)[0]?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      // 🚀 Optimize Image before upload (Method 1)
      const coverFile = formData.get('coverImage') as File;
      if (coverFile && coverFile.size > 0 && coverFile.name !== "undefined") {
        try {
          const { prepareImageForUpload } = await import('@/lib/client-utils');
          const compressedBlob = await prepareImageForUpload(coverFile, 800, 0.8);
          // Replace original with optimized one
          formData.set('coverImage', compressedBlob, 'cover.webp');
        } catch (imgError) {
          console.error("Compression failed, using original:", imgError);
          // Fallback to original if compression fails
        }
      }

      const endpoint = initialData ? '/api/novel/edit' : '/api/novel/create';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const res = await response.json() as { success: boolean; slug?: string; error?: string };
      if (res.success) {
        // success ရရင် Author Dashboard ကို ပြန်သွားပါမယ်
        router.push('/writer');
        router.refresh();
      } else {
        alert(res.error || "Failed to save novel");
      }
    } catch (error) {
      alert("An error occurred while saving the novel");
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
      onSubmit={handleSubmit}
      method="POST"
      encType="multipart/form-data"
      noValidate // Disable browser validation tooltips
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
          {t('coverImage')}
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
                  {t('uploadCover')}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">{t('formats')}</p>
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
        <label className="block text-sm font-bold text-[var(--foreground)] mb-1">{t('novelTitle')}</label>
        <input
          name="title"
          defaultValue={initialData?.title}
          placeholder={t('novelTitlePlaceholder')}
          className={`w-full border bg-[var(--surface)] text-[var(--foreground)] px-4 py-3 rounded-xl focus:ring-2 focus:ring-[var(--action)] focus:border-transparent outline-none transition-all ${errors.title ? 'border-red-500 bg-red-50/10' : 'border-[var(--border)]'
            }`}
        />
        {errors.title && (
          <p className="text-red-500 text-xs mt-1 font-medium animate-in fade-in slide-in-from-top-1">
            ⚠️ {errors.title}
          </p>
        )}
      </div>

      {/* English Title */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-bold text-[var(--foreground)]">{t('englishTitle')}</label>
          <span className={`text-[11px] font-medium ${(initialData?.englishTitle?.length || 0) > 100 ? 'text-red-500' : 'text-[var(--text-muted)]'
            }`}>
            {initialData?.englishTitle?.length || 0} / 100
          </span>
        </div>
        <input
          name="englishTitle"
          defaultValue={initialData?.englishTitle}
          placeholder={t('englishTitlePlaceholder')}
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
          className={`w-full border bg-[var(--surface)] text-[var(--foreground)] px-4 py-3 rounded-xl focus:ring-2 focus:ring-[var(--action)] focus:border-transparent outline-none transition-all ${errors.englishTitle ? 'border-red-500 bg-red-50/10' : 'border-[var(--border)]'
            }`}
        />
        {errors.englishTitle && (
          <p className="text-red-500 text-xs mt-1 font-medium animate-in fade-in slide-in-from-top-1">
            ⚠️ {errors.englishTitle}
          </p>
        )}
        <p className="text-[11px] text-[var(--text-muted)] mt-1 pl-1">
          {t('slugWarning')}
        </p>
      </div>

      {/* 👇 Tags (အသစ်ထည့်ထားသော အပိုင်း) */}
      <div>
        <label className="block text-sm font-bold text-[var(--foreground)] mb-1">{t('tags')}</label>
        <input
          name="tags"
          defaultValue={initialData?.tags || ""}
          placeholder={t('tagsPlaceholder')}
          className="w-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] px-4 py-3 rounded-xl focus:ring-2 focus:ring-[var(--action)] focus:border-transparent outline-none transition-shadow"
        />
        <p className="text-[11px] text-[var(--text-muted)] mt-1 pl-1 font-medium">
          {t('tagsWarning')}
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-bold text-[var(--foreground)] mb-1">{t('synopsis')}</label>
        <textarea
          name="description"
          rows={5}
          defaultValue={initialData?.description || ""}
          placeholder={t('synopsisPlaceholder')}
          className="w-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] px-4 py-3 rounded-xl focus:ring-2 focus:ring-[var(--action)] focus:border-transparent outline-none transition-shadow"
        />
      </div>

      <div className="pt-4 flex flex-row items-center justify-center gap-3 w-full sm:max-w-sm mx-auto">
        {/* Cancel နှိပ်ရင် Edit Mode ဆို မူရင်း Novel ဆီပြန်မယ်၊ Create Mode ဆို Home ပြန်မယ် */}
        <Button asChild variant="ghost" className="rounded-full flex-1 sm:w-40 border border-[var(--border)]">
          <Link href={initialData ? `/novel/${initialData.englishTitle}` : "/"}>
            {t('cancel')}
          </Link>
        </Button>

        <Button
          type="submit"
          variant="premium"
          disabled={isSubmitting}
          className="rounded-full flex-1 sm:w-40 font-bold shadow-lg"
        >
          {isSubmitting ? t('saving') : finalSubmitLabel}
        </Button>
      </div>

    </form>
  );
}