'use client';

import { useState, useRef, useEffect, useTransition } from 'react'; // useTransition ထပ်ထည့်ထားတယ်
import { Link, useRouter } from '@/i18n/routing';

// Props မှာ novelId ထပ်ဖြည့်လိုက်ပါတယ်
export default function NovelMenu({ slug, novelId }: { slug: string, novelId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition(); // Loading ပြဖို့
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ဖျက်တဲ့ Function
  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this novel? This cannot be undone.")) {
      startTransition(async () => {
        try {
          const response = await fetch('/api/novel/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ novelId }),
          });
          const res = await response.json() as { success: boolean; error?: string };
          if (!res.success) {
            alert(res.error || "Failed to delete novel");
          } else {
            router.refresh();
          }
        } catch (error) {
          alert("Failed to delete novel");
        } finally {
          setIsOpen(false);
        }
      });
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden py-1">

          <Link href={`/novel/${slug}/create`} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
            ✍️ Add Chapter
          </Link>

          <Link href={`/novel/${slug}/edit`} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
            ✏️ Edit Novel
          </Link>

          <div className="h-px bg-gray-100 my-1"></div>

          {/* Delete Button */}
          <button
            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "🗑️ Delete"}
          </button>
        </div>
      )}
    </div>
  );
}