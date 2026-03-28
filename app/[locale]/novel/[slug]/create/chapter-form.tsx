"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from '@/i18n/routing';
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ChevronLeft, Crown, Sparkles, Save, Folder, Edit2, Trash2, MoreVertical, ChevronDown, UploadCloud, Loader2 } from "lucide-react";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
        // Redirection logic: Go back to the previous page (like a browser back button)
        router.back();
        // We still call refresh to ensure the previous page shows updated data when it mounts
        setTimeout(() => router.refresh(), 100);
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
      <input type="hidden" name="novelId" value={novelId} />
      <input type="hidden" name="volumeId" value={selectedVolume} />

      {/* ========================
          1. Top Navigation Bar (Sticky with Glassmorphism)
         ======================== */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50 px-6 py-4 mb-12">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">

          {/* Left: Back & Chapter Info */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-90"
            >
              <ChevronLeft size={20} />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1 bg-border/50" />

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 text-sm bg-muted/50 hover:bg-muted border border-border/50 rounded-xl px-4 py-2 transition-all text-foreground font-bold"
              >
                <Folder size={16} className="text-primary/70" />
                <span className="truncate max-w-[150px]">
                  {selectedVolume
                    ? localVolumes.find(v => v.id.toString() === selectedVolume)?.name || t('unknownVolume')
                    : t('noVolume')}
                </span>
                <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-background border border-border rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                  <div className="p-2 flex flex-col gap-1">
                    {/* No Volume Option */}
                    {localVolumes.length === 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVolume("");
                          setIsDropdownOpen(false);
                        }}
                        className={`flex items-center px-4 py-2.5 text-sm rounded-xl hover:bg-muted/50 transition-colors text-left ${selectedVolume === "" ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground font-semibold"}`}
                      >
                        {t('noVolume')}
                      </button>
                    )}

                    {/* Volumes List */}
                    {localVolumes.map((v) => (
                      <div key={v.id} className={`group flex items-center justify-between px-2 py-1.5 text-sm rounded-xl hover:bg-muted/50 transition-colors ${selectedVolume === v.id.toString() ? "bg-primary/10" : ""}`}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVolume(v.id.toString());
                            setIsDropdownOpen(false);
                          }}
                          className={`flex-1 text-left truncate px-2 py-1 ${selectedVolume === v.id.toString() ? "text-primary font-bold" : "text-muted-foreground font-semibold"}`}
                        >
                          {v.name}
                        </button>

                        <div className="relative flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="group/menu relative">
                            <button type="button" className="p-1.5 rounded-lg hover:bg-background border border-transparent hover:border-border text-muted-foreground">
                              <MoreVertical size={14} />
                            </button>
                            <div className="absolute left-full top-0 pl-1 hidden group-hover/menu:block hover:block z-[60] min-w-[140px]">
                              <div className="bg-background border border-border rounded-xl shadow-xl overflow-hidden py-1">
                                <button type="button" onClick={() => { setEditingVolume({ id: v.id.toString(), name: v.name }); setShowEditModal(true); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted/50 flex items-center gap-2">
                                  <Edit2 size={12} /> {t('editName')}
                                </button>
                                <button type="button" onClick={() => handleDeleteVolume(v.id.toString())} className="w-full text-left px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 flex items-center gap-2">
                                  <Trash2 size={12} /> {t('delete')}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-2 border-t border-border bg-muted/30">
                    <button
                      type="button"
                      onClick={() => {
                        setShowVolumeModal(true);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-black text-primary hover:bg-primary/10 rounded-xl transition-colors"
                    >
                      + {t('addNewVolume')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Separator orientation="vertical" className="h-6 mx-1 bg-border/50" />

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Order</span>
              <input
                name="sortIndex"
                type="number"
                defaultValue={initialData?.sortIndex ?? suggestedIndex}
                step="0.1"
                className="w-16 bg-muted/50 hover:bg-muted focus:bg-background border border-border/30 rounded-xl px-2 py-2 font-black text-foreground outline-none text-center transition-all text-sm"
                required
              />
            </div>
          </div>

          {/* Right: Premium & Publish */}
          <div className="flex items-center gap-4">
            <Button
              disabled={loading}
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 px-8 rounded-full shadow-lg shadow-indigo-500/20 active:scale-95 transition-all text-sm disabled:opacity-50 border-none"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <span>{initialData ? t('saveChanges') : t('publish')}</span>
              )}
            </Button>
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