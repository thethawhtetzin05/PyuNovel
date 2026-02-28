'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { useModalStore } from "@/lib/store/use-modal-store";
import { useTranslations } from 'next-intl';

export default function NovelMenu({ slug, novelId }: { slug: string, novelId: string }) {
  const tModal = useTranslations('Modal');
  const tMenu = useTranslations('NovelMenu');
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const openModal = useModalStore((state: any) => state.openModal);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = () => {
    // Custom Confirm Modal နဲ့ အစားထိုးလိုက်ပါတယ်
    openModal("confirm", {
      title: tModal("deleteNovelTitle"),
      message: tModal("deleteNovelDesc"),
      confirmText: tModal("deleteText"),
      cancelText: tModal("cancel"),
      isDestructive: true,
      onConfirm: async () => {
        try {
          const response = await fetch('/api/novel/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ novelId }),
          });
          const res = await response.json() as { success: boolean; error?: string };
          if (!res.success) {
            openModal("alert", {
              title: tModal("errorTitle"),
              message: res.error || tModal("deleteErrorDesc"),
              type: "error"
            });
          } else {
            router.refresh();
          }
        } catch (error) {
          openModal("alert", {
            title: tModal("errorTitle"),
            message: tModal("deleteErrorDesc"),
            type: "error"
          });
        }
      }
    });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-[var(--surface-2)] rounded-full transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-[999] overflow-hidden py-1 ring-1 ring-black/5">

          <Link href={`/novel/${slug}/create`} className="block px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--action)] transition-colors">
            {tMenu("addChapter")}
          </Link>

          <Link href={`/novel/${slug}/edit`} className="block px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--action)] transition-colors">
            {tMenu("editNovel")}
          </Link>

          <div className="h-px bg-[var(--border)] my-1"></div>

          <button
            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? tMenu("deleting") : tMenu("delete")}
          </button>
        </div>
      )}
    </div>
  );
}
