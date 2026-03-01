'use client';

import { useRef, useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, FileText, Loader2, CheckCircle, AlertCircle, ChevronDown, Folder, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { parseChaptersFromText, ParsedChapter } from '@/lib/utils';

type BulkUploadResult =
    | { success: true; count: number }
    | { success: false; error: string };

interface Volume {
    id: number;
    name: string;
    sortIndex: number;
}

interface BulkUploadModalProps {
    novelId: number;
    novelSlug: string;
    volumes?: Volume[];
    onClose: () => void;
}

export default function BulkUploadModal({ novelId, novelSlug, volumes = [], onClose }: BulkUploadModalProps) {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<ParsedChapter[] | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [result, setResult] = useState<BulkUploadResult | null>(null);
    const [isPending, startTransition] = useTransition();
    const [showGuide, setShowGuide] = useState(false);
    const [localVolumes, setLocalVolumes] = useState<Volume[]>(volumes);
    const [selectedVolumeId, setSelectedVolumeId] = useState<string>('');

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [editingVolume, setEditingVolume] = useState<{ id: string, name: string } | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ---- File Preview (client-side parse for both .txt and .docx) ----
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        setResult(null);

        try {
            if (file.name.endsWith('.docx')) {
                // mammoth client-side import
                const mammoth = await import('mammoth');
                const arrayBuffer = await file.arrayBuffer();
                const res = await mammoth.extractRawText({ arrayBuffer });
                const text = res.value;
                console.log("DEBUG: Extracted text from .docx", text.slice(0, 500));
                const parsed = parseChaptersFromText(text, true);
                setPreview(parsed);
            } else if (file.name.endsWith('.txt')) {
                const text = await file.text();
                // preview အတွက် HTML format နဲ့ယူမယ် (Formatting preserve လုပ်ဖို့)
                const parsed = parseChaptersFromText(text, true);
                setPreview(parsed);
            } else {
                setPreview(null);
            }
        } catch (err: any) {
            setResult({ success: false, error: `Error parsing file: ${err.message}` });
            setPreview(null);
        }
    };

    const [showVolumeModal, setShowVolumeModal] = useState(false);
    const [newVolumeName, setNewVolumeName] = useState("");
    const [isCreatingVolume, setIsCreatingVolume] = useState(false);

    const [deletingVolumeId, setDeletingVolumeId] = useState<string | null>(null);

    const handleVolumeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === "__new_volume__") {
            setShowVolumeModal(true);
            e.target.value = selectedVolumeId;
        } else {
            setSelectedVolumeId(val);
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
                body: JSON.stringify({ novelId, novelSlug, name: newVolumeName }),
            });
            const data = await res.json() as { success: boolean; volume?: Volume; error?: string };
            if (data.success && data.volume) {
                setLocalVolumes([...localVolumes, data.volume]);
                setSelectedVolumeId(data.volume.id.toString());
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
                if (selectedVolumeId === deletingVolumeId) setSelectedVolumeId("");
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


    // ---- Submit ----
    const handleUpload = () => {
        if (!preview || preview.length === 0) return;

        startTransition(async () => {
            try {
                const response = await fetch(`/api/novel/${novelSlug}/bulk-upload`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        novelId,
                        novelSlug,
                        volumeId: selectedVolumeId ? Number(selectedVolumeId) : null,
                        chapters: preview
                    }),
                });

                const res = await response.json() as { success: boolean; count?: number; error?: string };

                setResult(res.success
                    ? { success: true, count: res.count || 0 }
                    : { success: false, error: res.error || 'Unknown error' }
                );

                if (res.success) {
                    setPreview(null);
                    setFileName('');
                    if (fileRef.current) fileRef.current.value = '';
                    router.refresh(); // Data အသစ်တွေ ပေါ်လာအောင် refresh လုပ်မယ်
                }
            } catch (err: any) {
                setResult({ success: false, error: `Upload failed: ${err.message}` });
            }
        });
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-[var(--border)] shrink-0">
                        <div>
                            <h2 className="text-xl font-extrabold text-[var(--foreground)]">File Chapter Upload</h2>
                            <p className="text-sm text-[var(--text-muted)] mt-0.5">Upload a .txt or .docx file to add multiple chapters at once.</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--surface-2)] transition-colors text-[var(--text-muted)]">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="overflow-y-auto p-6 space-y-5 flex-1">

                        {/* Format Guide (collapsible) */}
                        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                            <button
                                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
                                onClick={() => setShowGuide(v => !v)}
                            >
                                <span>📖 File Format Guide</span>
                                <ChevronDown size={16} className={`transition-transform ${showGuide ? 'rotate-180' : ''}`} />
                            </button>
                            {showGuide && (
                                <div className="px-4 pb-4 pt-1 text-sm text-[var(--text-muted)] space-y-2 bg-[var(--surface-2)]">
                                    <p className="font-semibold text-[var(--foreground)]">Auto-detected Headings</p>
                                    <pre className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 text-xs overflow-x-auto leading-relaxed">
                                        {`အခန်း (၁) စတင်ခြင်း
ဒီတစ်ကလေး ပထမဆုံးအကြောင်းအရာ...

အပိုင်း (၂) ပြောင်းလဲမှု
ဒုတိယ အကြောင်းအရာ...`}
                                    </pre>
                                    <p className="text-xs opacity-70">Keywords: အခန်း, အပိုင်း, Chapter. Burmese digits (၀-၉) and English digits (0-9) are supported.</p>
                                </div>
                            )}
                        </div>

                        {/* Volume Selection */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[var(--foreground)]">Select Volume (Optional)</label>
                            <div className="relative z-40" ref={dropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full flex items-center justify-between bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--action)] transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <Folder size={16} className="text-[var(--text-muted)]" />
                                        <span className="truncate">
                                            {selectedVolumeId
                                                ? localVolumes.find(v => v.id.toString() === selectedVolumeId)?.name || "Unknown Volume"
                                                : "No Volume"}
                                        </span>
                                    </div>
                                    <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="p-1.5 flex flex-col gap-0.5 rounded-t-xl">
                                            {/* No Volume Option */}
                                            {localVolumes.length === 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedVolumeId("");
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={`flex items-center px-4 py-2.5 text-sm rounded-lg hover:bg-[var(--surface-2)] transition-colors text-left ${selectedVolumeId === "" ? "bg-[var(--action)]/10 text-[var(--action)] font-bold" : "text-[var(--text-muted)] font-medium"}`}
                                                >
                                                    No Volume
                                                </button>
                                            )}

                                            {/* Volumes List */}
                                            {localVolumes.map((v) => (
                                                <div key={v.id} className={`group flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-[var(--surface-2)] transition-colors ${selectedVolumeId === v.id.toString() ? "bg-[var(--action)]/10" : ""}`}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedVolumeId(v.id.toString());
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        className={`flex-1 text-left truncate pr-3 ${selectedVolumeId === v.id.toString() ? "text-[var(--action)] font-bold" : "text-[var(--text-muted)] font-medium"}`}
                                                    >
                                                        {v.name}
                                                    </button>

                                                    {/* 3 dots menu inside the row */}
                                                    <div className="relative flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                        <div className="group/menu relative">
                                                            <button type="button" className="p-1.5 rounded-md hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border)] text-[var(--text-muted)]">
                                                                <MoreVertical size={14} />
                                                            </button>

                                                            {/* Actions Dropdown */}
                                                            {/* Inner wrapper uses pt-1 to create an invisible hover bridge, preventing instant menu close */}
                                                            <div className="absolute right-0 top-full pt-1 hidden group-hover/menu:block hover:block z-[70] w-36">
                                                                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden">
                                                                    <button type="button" onClick={() => { setEditingVolume({ id: v.id.toString(), name: v.name }); setShowEditModal(true); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-2)] flex items-center gap-2">
                                                                        <Edit2 size={12} /> Edit Name
                                                                    </button>
                                                                    <button type="button" onClick={() => handleDeleteVolume(v.id.toString())} className="w-full text-left px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 flex items-center gap-2">
                                                                        <Trash2 size={12} /> Delete
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
                                                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold text-[var(--action)] hover:bg-[var(--action)]/10 rounded-lg transition-colors"
                                            >
                                                + Add New Volume
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* File Drop Zone */}
                        <label
                            htmlFor="bulk-file-input"
                            className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[var(--border)] rounded-xl p-8 cursor-pointer hover:border-[var(--action)] hover:bg-[var(--surface-2)] transition-all"
                        >
                            {fileName ? (
                                <>
                                    <FileText size={36} className="text-[var(--action)]" />
                                    <span className="font-semibold text-[var(--foreground)] text-sm">{fileName}</span>
                                    <span className="text-xs text-[var(--text-muted)]">Click to change file</span>
                                </>
                            ) : (
                                <>
                                    <Upload size={36} className="text-[var(--text-muted)]" />
                                    <span className="font-semibold text-[var(--foreground)]">Click to select a file</span>
                                    <span className="text-xs text-[var(--text-muted)]">Supports .txt and .docx</span>
                                </>
                            )}
                        </label>
                        <input
                            ref={fileRef}
                            id="bulk-file-input"
                            type="file"
                            accept=".txt,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            className="sr-only"
                            onChange={handleFileChange}
                        />

                        {/* Result Banner */}
                        {result && (
                            <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${result.success ? 'bg-green-500/10 border-green-500/30 text-green-600' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                                {result.success
                                    ? <CheckCircle size={18} className="shrink-0 mt-0.5" />
                                    : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                                <span>{result.success ? `✅ ${result.count} chapters uploaded successfully!` : result.error}</span>
                            </div>
                        )}

                        {/* Preview Table */}
                        {preview && preview.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-bold text-[var(--foreground)]">Preview — {preview.length} chapters detected</p>
                                <div className="max-h-52 overflow-y-auto rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
                                    {preview.map((ch, i) => (
                                        <div key={i} className="flex items-start gap-3 px-4 py-2.5 text-sm">
                                            <span className="shrink-0 text-xs font-bold text-[var(--text-muted)] bg-[var(--surface-2)] px-2 py-0.5 rounded-md mt-0.5">#{i + 1}</span>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-[var(--foreground)] truncate">{ch.title}</p>
                                                <p className="text-[var(--text-muted)] text-xs truncate">{ch.content.replace(/<[^>]*>/g, '').slice(0, 80)}…</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {preview && preview.length === 0 && (
                            <div className="flex items-center gap-2 text-sm text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                                <AlertCircle size={16} />
                                <span>No chapters detected. Check your file format using the guide above.</span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 p-6 border-t border-[var(--border)] shrink-0">
                        <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition">
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={!fileName || isPending}
                            className="px-6 py-2.5 rounded-xl font-bold btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
                        >
                            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                            {isPending ? 'Uploading…' : 'Upload Chapters'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Volume Creation Modal */}
            {showVolumeModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-[var(--foreground)] mb-1">Create Volume</h3>
                            <p className="text-sm text-[var(--text-muted)] mb-5">Enter a clear name for the new volume.</p>
                            <input
                                type="text"
                                value={newVolumeName}
                                onChange={(e) => setNewVolumeName(e.target.value)}
                                placeholder="e.g., Volume 1: the start"
                                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--action)] transition-colors"
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
                                className="px-5 py-2.5 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface)] rounded-xl transition-colors"
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

            {/* Editing Volume Modal */}
            {showEditModal && editingVolume && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-[var(--foreground)] mb-1">Edit Volume Name</h3>
                            <p className="text-sm text-[var(--text-muted)] mb-5">Change the name of your volume.</p>
                            <input
                                type="text"
                                value={editingVolume.name}
                                onChange={(e) => setEditingVolume({ ...editingVolume, name: e.target.value })}
                                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--action)] transition-colors"
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
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingVolume(null);
                                }}
                                className="px-5 py-2.5 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface)] rounded-xl transition-colors"
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
                    <div className="bg-[var(--surface)] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                                <Trash2 className="text-red-500" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Delete Volume?</h3>
                            <p className="text-sm text-[var(--text-muted)]">
                                Are you sure you want to delete this volume? All chapters inside it will be moved to <strong>"No Volume"</strong>. This action cannot be undone.
                            </p>
                        </div>
                        <div className="bg-[var(--surface-2)] px-6 py-4 flex justify-end gap-3 border-t border-[var(--border)]">
                            <button
                                type="button"
                                onClick={() => setDeletingVolumeId(null)}
                                className="px-5 py-2.5 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface)] rounded-xl transition-colors"
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
        </>
    );
}
