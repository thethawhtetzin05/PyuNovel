"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from '@/i18n/routing';
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ChevronLeft, Crown, Sparkles, Save, Folder, Edit2, Trash2, MoreVertical, ChevronDown, UploadCloud } from "lucide-react";
import { useTranslations } from 'next-intl';

// Bulk Upload Import
const BulkUploadModal = dynamic(() => import('../bulk-upload-modal'), { ssr: false });

// Editor Import
const Editor = dynamic(() => import("@/components/editor/Editor"), {
  ssr: false,
  loading: () => <div className="h-[70vh] animate-pulse bg-[var(--surface-2)] rounded-lg"></div>
});

interface Volume {
  id: number;
  name: string;
  sortIndex: number;
}

// ✅ Props Interface သတ်မှတ်ခြင်း (Edit အတွက် initialData ထပ်ဖြည့်ထားသည်)
interface ChapterFormProps {
  slug: string;
  novelId: number;
  suggestedIndex?: number;
  volumes?: Volume[];
  lastVolumeId?: number;
  initialData?: {
    id: string;
    title: string;
    content: string;
    sortIndex: number;
    isPaid: boolean;
    volumeId?: number | null;
  };
  saveAction?: (formData: FormData) => Promise<void>; // Create mode အတွက် legacy support
}

export default function ChapterForm({ slug, novelId, suggestedIndex, volumes = [], lastVolumeId, initialData }: ChapterFormProps) {
  const router = useRouter();
  const t = useTranslations('ChapterForm');
  const tNav = useTranslations('Navbar');
  const [loading, setLoading] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const [localVolumes, setLocalVolumes] = useState<Volume[]>(volumes);
  const [selectedVolume, setSelectedVolume] = useState<string>(
    initialData?.volumeId?.toString() ?? lastVolumeId?.toString() ?? ""
  );

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showVolumeModal, setShowVolumeModal] = useState(false);
  const [newVolumeName, setNewVolumeName] = useState("");
  const [isCreatingVolume, setIsCreatingVolume] = useState(false);

  // volumeId submit အတွက်
  const [editingVolume, setEditingVolume] = useState<{ id: string, name: string } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingVolumeId, setDeletingVolumeId] = useState<string | null>(null);

  const handleVolumeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "__new_volume__") {
      setShowVolumeModal(true);
      e.target.value = selectedVolume; // Reset visual state immediately
    } else {
      setSelectedVolume(val);
    }
  };

  const handleCreateVolume = async () => {
    if (!newVolumeName.trim()) {
      setShowVolumeModal(false);
      return;
    }
    setIsCreatingVolume(true);
    try {
      const res = await fetch('/api/novel/volume/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novelId, novelSlug: slug, name: newVolumeName }),
      });
      const data = await res.json() as { success: boolean; volume?: Volume; error?: string };
      if (data.success && data.volume) {
        setLocalVolumes([...localVolumes, data.volume]);
        setSelectedVolume(data.volume.id.toString());
        setShowVolumeModal(false);
        setNewVolumeName("");
      } else {
        alert(data.error || "Failed to create volume");
      }
    } catch (err) {
      alert("Error creating volume");
    } finally {
      setIsCreatingVolume(false);
    }
  };

  const handleEditVolumeSubmit = async () => {
    if (!editingVolume?.name.trim()) return;
    setIsCreatingVolume(true);
    try {
      const res = await fetch('/api/novel/volume/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novelId, volumeId: Number(editingVolume.id), name: editingVolume.name }),
      });
      const data = await res.json() as { success: boolean; volume?: Volume; error?: string };
      if (data.success && data.volume) {
        setLocalVolumes(localVolumes.map(v => v.id.toString() === editingVolume.id ? data.volume! : v));
        setShowEditModal(false);
      } else {
        alert(data.error || "Failed to edit volume");
      }
    } catch (err) {
      alert("Error editing volume");
    } finally {
      setIsCreatingVolume(false);
    }
  };

  const handleDeleteVolume = (id: string) => {
    setDeletingVolumeId(id);
    setIsDropdownOpen(false);
  };

  const confirmDeleteVolume = async () => {
    if (!deletingVolumeId) return;
    try {
      const res = await fetch('/api/novel/volume/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novelId, volumeId: Number(deletingVolumeId) }),
      });
      const data = await res.json() as { success: boolean; error?: string };
      if (data.success) {
        if (selectedVolume === deletingVolumeId) setSelectedVolume("");
        setLocalVolumes(localVolumes.filter(v => v.id.toString() !== deletingVolumeId));
      } else {
        alert(data.error || "Failed to delete volume");
      }
    } catch (err) {
      alert("Error deleting volume");
    } finally {
      setDeletingVolumeId(null);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      const volumeIdRaw = formData.get("volumeId");
      const volumeId = volumeIdRaw ? Number(volumeIdRaw) : null;

      const endpoint = initialData ? '/api/novel/chapter/edit' : '/api/novel/chapter/create';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: initialData ? {} : { 'Content-Type': 'application/json' },
        body: initialData
          ? (() => {
            formData.set("content", contentRef.current);
            return formData;
          })()
          : JSON.stringify({
            novelId,
            novelSlug: slug,
            volumeId,
            title,
            content,
            sortIndex,
            isPaid
          }),
      });

      const res = await response.json() as { success: boolean; sortIndex?: number; error?: string };
      if (res.success) {
        // Edit mode ဆိုရင် novel page ကို ပြန်သွားမယ်၊ Create mode ဆိုရင် အခန်းထဲ တန်းဝင်မယ်
        if (initialData) {
          router.push(`/novel/${slug}`);
        } else {
          const finalSortIndex = res.sortIndex || sortIndex;
          router.push(`/novel/${slug}/${finalSortIndex}`);
        }
        router.refresh(); // ဒေတာအသစ်ပေါ်အောင် refresh လုပ်ပေးမယ်
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
      className="min-h-screen bg-[var(--surface)]"
    >

      {/* ✅ Edit Mode ဆိုရင် ID ကို Hidden Input အနေနဲ့ ထည့်ပေးပေးရမယ် */}
      {initialData && <input type="hidden" name="chapterId" value={initialData.id} />}
      <input type="hidden" name="novelSlug" value={slug} />

      {/* ========================
          1. Top Navigation Bar 
         ======================== */}
      <div className="sticky top-0 z-30 bg-[var(--surface)]/80 backdrop-blur-md border-b border-[var(--border)] px-6 py-4 flex-wrap">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

          {/* Left: Back & Chapter Info */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="group flex items-center justify-center w-9 h-9 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-gray-400 hover:text-[var(--foreground)] hover:border-[var(--action)] transition-all active:scale-90"
            >
              <ChevronLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 text-sm bg-[var(--surface-2)] hover:bg-gray-100 border border-transparent focus:border-gray-300 rounded px-3 py-1.5 transition-all text-[var(--foreground)] font-semibold"
              >
                <Folder size={16} className="text-gray-400" />
                <span className="truncate max-w-[120px]">
                  {selectedVolume
                    ? localVolumes.find(v => v.id.toString() === selectedVolume)?.name || t('unknownVolume')
                    : t('noVolume')}
                </span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-1.5 flex flex-col gap-0.5 rounded-t-xl">
                    {/* No Volume Option */}
                    {localVolumes.length === 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVolume("");
                          setIsDropdownOpen(false);
                        }}
                        className={`flex items-center px-3 py-2 text-sm rounded-lg hover:bg-[var(--surface-2)] transition-colors text-left ${selectedVolume === "" ? "bg-[var(--action)]/10 text-[var(--action)] font-bold" : "text-gray-600 font-medium"}`}
                      >
                        {t('noVolume')}
                      </button>
                    )}

                    {/* Volumes List */}
                    {localVolumes.map((v) => (
                      <div key={v.id} className={`group flex items-center justify-between px-2 py-1.5 text-sm rounded-lg hover:bg-[var(--surface-2)] transition-colors ${selectedVolume === v.id.toString() ? "bg-[var(--action)]/10" : ""}`}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVolume(v.id.toString());
                            setIsDropdownOpen(false);
                          }}
                          className={`flex-1 text-left truncate pr-2 ${selectedVolume === v.id.toString() ? "text-[var(--action)] font-bold" : "text-gray-600 font-medium"}`}
                        >
                          {v.name}
                        </button>

                        {/* 3 dots menu inside the row */}
                        <div className="relative flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <div className="group/menu relative">
                            <button type="button" className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors">
                              <MoreVertical size={14} />
                            </button>

                            {/* Actions Dropdown */}
                            {/* Actions Dropdown */}
                            {/* Inner wrapper uses pl-1 to create an invisible hover bridge, preventing instant menu close */}
                            <div className="absolute left-full top-0 pl-1 hidden group-hover/menu:block hover:block z-[60] min-w-[124px]">
                              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden">
                                <button type="button" onClick={() => { setEditingVolume({ id: v.id.toString(), name: v.name }); setShowEditModal(true); setIsDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-[var(--surface-2)] flex items-center gap-2">
                                  <Edit2 size={12} /> {t('editName')}
                                </button>
                                <button type="button" onClick={() => handleDeleteVolume(v.id.toString())} className="w-full text-left px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 flex items-center gap-2">
                                  <Trash2 size={12} /> {t('delete')}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-1.5 border-t border-[var(--border)] bg-[var(--surface-2)]/50 rounded-b-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setShowVolumeModal(true);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold text-blue-600 hover:bg-blue-100/50 rounded-lg transition-colors"
                    >
                      + {t('addNewVolume')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--text-muted)] font-medium uppercase tracking-wide text-xs">{t('orderNo')}</span>
              <input
                name="sortIndex"
                type="number"
                // ✅ Edit ဆိုရင် အဟောင်းပြမယ်၊ New ဆိုရင် အသစ်ပြမယ်
                defaultValue={initialData?.sortIndex ?? suggestedIndex}
                step="0.1"
                className="w-16 bg-[var(--surface-2)] hover:bg-gray-100 focus:bg-[var(--surface)] border border-transparent focus:border-gray-300 rounded px-2 py-1 font-bold text-[var(--foreground)] outline-none text-center transition-all"
                required
              />
            </div>
          </div>

          {/* Right: Premium & Publish */}
          <div className="flex items-center gap-4 sm:gap-6 self-end md:self-auto">
            {/* 🚀 Publish / Save Button */}
            <button
              disabled={loading}
              type="submit"
              className="bg-slate-900 hover:bg-black text-white font-medium py-2.5 px-8 rounded-full shadow-lg shadow-gray-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>{t('saving')}</>
              ) : (
                <>
                  {/* Edit Mode ဆို Save, New ဆို Publish ပြမယ် */}
                  <span>{initialData ? t('saveChanges') : t('publish')}</span>
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
          placeholder={t('chapterTitlePlaceholder')}
          className="w-full text-3xl font-extrabold placeholder-gray-200 border-none outline-none focus:ring-0 p-0 bg-transparent leading-tight font-serif tracking-tight text-[var(--foreground)]"
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

      {/* Volume Creation Modal */}
      {showVolumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--surface)] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-1">{t('createVolume')}</h3>
              <p className="text-sm text-[var(--text-muted)] mb-5">{t('createVolumeDesc')}</p>
              <input
                type="text"
                value={newVolumeName}
                onChange={(e) => setNewVolumeName(e.target.value)}
                placeholder={t('volumeNamePlaceholder')}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateVolume();
                  }
                }}
              />
            </div>
            <div className="bg-[var(--surface-2)] px-6 py-4 flex justify-end gap-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => {
                  setShowVolumeModal(false);
                  setNewVolumeName("");
                }}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                disabled={isCreatingVolume}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleCreateVolume}
                disabled={!newVolumeName.trim() || isCreatingVolume}
                className="px-5 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-black rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-md active:scale-95"
              >
                {isCreatingVolume && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {t('saveVolume')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Volume Modal */}
      {showEditModal && editingVolume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--surface)] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-1">{t('editVolumeName')}</h3>
              <p className="text-sm text-[var(--text-muted)] mb-5">{t('editVolumeDesc')}</p>
              <input
                type="text"
                value={editingVolume.name}
                onChange={(e) => setEditingVolume({ ...editingVolume, name: e.target.value })}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleEditVolumeSubmit();
                  }
                }}
              />
            </div>
            <div className="bg-[var(--surface-2)] px-6 py-4 flex justify-end gap-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => { setShowEditModal(false); setEditingVolume(null); }}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                disabled={isCreatingVolume}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleEditVolumeSubmit}
                disabled={!editingVolume.name.trim() || isCreatingVolume}
                className="px-5 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-black rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-md active:scale-95"
              >
                {isCreatingVolume && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {t('saveChanges')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Volume Confirmation Modal */}
      {deletingVolumeId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--surface)] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">{t('deleteVolumeTitle')}</h3>
              <p className="text-sm text-[var(--text-muted)]">
                {t('deleteVolumeWarn1')} <strong>"{t('noVolume')}"</strong>. {t('deleteVolumeWarn2')}
              </p>
            </div>
            <div className="bg-[var(--surface-2)] px-6 py-4 flex justify-end gap-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setDeletingVolumeId(null)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={confirmDeleteVolume}
                className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md active:scale-95"
              >
                {t('deleteButton')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUploadModal
          novelId={novelId}
          novelSlug={slug}
          volumes={localVolumes}
          onClose={() => setShowBulkUpload(false)}
        />
      )}
    </form>
  );
}