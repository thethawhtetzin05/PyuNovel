"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ChevronLeft, Crown, Sparkles, Save, Folder, Edit2, Trash2, MoreVertical, ChevronDown } from "lucide-react";

// Editor Import
const Editor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
  loading: () => <div className="h-[70vh] animate-pulse bg-gray-50 rounded-lg"></div>
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
  const [loading, setLoading] = useState(false);

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
      className="min-h-screen bg-white"
    >

      {/* ✅ Edit Mode ဆိုရင် ID ကို Hidden Input အနေနဲ့ ထည့်ပေးပေးရမယ် */}
      {initialData && <input type="hidden" name="chapterId" value={initialData.id} />}
      <input type="hidden" name="novelSlug" value={slug} />

      {/* ========================
          1. Top Navigation Bar 
         ======================== */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex-wrap">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

          {/* Left: Back & Chapter Info */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={`/novel/${slug}`}
              className="group flex items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium text-sm">Back</span>
            </Link>

            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 text-sm bg-gray-50 hover:bg-gray-100 border border-transparent focus:border-gray-300 rounded px-3 py-1.5 transition-all text-gray-900 font-semibold"
              >
                <Folder size={16} className="text-gray-400" />
                <span className="truncate max-w-[120px]">
                  {selectedVolume
                    ? localVolumes.find(v => v.id.toString() === selectedVolume)?.name || "Unknown Volume"
                    : "No Volume"}
                </span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-1.5 flex flex-col gap-0.5 rounded-t-xl">
                    {/* No Volume Option */}
                    {localVolumes.length === 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVolume("");
                          setIsDropdownOpen(false);
                        }}
                        className={`flex items-center px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors text-left ${selectedVolume === "" ? "bg-blue-50/50 text-blue-600 font-bold" : "text-gray-600 font-medium"}`}
                      >
                        No Volume
                      </button>
                    )}

                    {/* Volumes List */}
                    {localVolumes.map((v) => (
                      <div key={v.id} className={`group flex items-center justify-between px-2 py-1.5 text-sm rounded-lg hover:bg-gray-50 transition-colors ${selectedVolume === v.id.toString() ? "bg-blue-50/50" : ""}`}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVolume(v.id.toString());
                            setIsDropdownOpen(false);
                          }}
                          className={`flex-1 text-left truncate pr-2 ${selectedVolume === v.id.toString() ? "text-blue-600 font-bold" : "text-gray-600 font-medium"}`}
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
                              <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                                <button type="button" onClick={() => { setEditingVolume({ id: v.id.toString(), name: v.name }); setShowEditModal(true); setIsDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                                  <Edit2 size={12} /> Edit Name
                                </button>
                                <button type="button" onClick={() => handleDeleteVolume(v.id.toString())} className="w-full text-left px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 flex items-center gap-2">
                                  <Trash2 size={12} /> Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-1.5 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setShowVolumeModal(true);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold text-blue-600 hover:bg-blue-100/50 rounded-lg transition-colors"
                    >
                      + Add New Volume
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

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
          <div className="flex items-center gap-4 sm:gap-6 self-end md:self-auto">

            {/* ✨ Premium Toggle Switch ✨ */}
            <label className="cursor-pointer flex items-center gap-2 sm:gap-3 group select-none">
              <div className="flex items-center gap-1.5 text-gray-500 group-hover:text-yellow-600 transition-colors">
                <Crown size={16} />
                <span className="text-sm font-medium hidden sm:block">Premium</span>
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

      {/* Volume Creation Modal */}
      {showVolumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Create Volume</h3>
              <p className="text-sm text-gray-500 mb-5">Enter a clear name for the new volume.</p>
              <input
                type="text"
                value={newVolumeName}
                onChange={(e) => setNewVolumeName(e.target.value)}
                placeholder="e.g., Volume 1: the start"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateVolume();
                  }
                }}
              />
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowVolumeModal(false);
                  setNewVolumeName("");
                }}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                disabled={isCreatingVolume}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateVolume}
                disabled={!newVolumeName.trim() || isCreatingVolume}
                className="px-5 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-black rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-md active:scale-95"
              >
                {isCreatingVolume && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Save Volume
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Volume Modal */}
      {showEditModal && editingVolume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Edit Volume Name</h3>
              <p className="text-sm text-gray-500 mb-5">Change the name of your volume.</p>
              <input
                type="text"
                value={editingVolume.name}
                onChange={(e) => setEditingVolume({ ...editingVolume, name: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleEditVolumeSubmit();
                  }
                }}
              />
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { setShowEditModal(false); setEditingVolume(null); }}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                disabled={isCreatingVolume}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditVolumeSubmit}
                disabled={!editingVolume.name.trim() || isCreatingVolume}
                className="px-5 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-black rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-md active:scale-95"
              >
                {isCreatingVolume && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Volume Confirmation Modal */}
      {deletingVolumeId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Volume?</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete this volume? All chapters inside it will be moved to <strong>"No Volume"</strong>. This action cannot be undone.
              </p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeletingVolumeId(null)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteVolume}
                className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}