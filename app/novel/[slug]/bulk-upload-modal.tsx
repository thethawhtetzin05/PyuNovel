'use client';

import { useRef, useState, useTransition } from 'react';
import { Upload, X, FileText, Loader2, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { parseChaptersFromText, ParsedChapter } from '@/lib/utils';

type BulkUploadResult =
    | { success: true; count: number }
    | { success: false; error: string };

interface BulkUploadModalProps {
    novelId: number;
    novelSlug: string;
    onClose: () => void;
}

export default function BulkUploadModal({ novelId, novelSlug, onClose }: BulkUploadModalProps) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<ParsedChapter[] | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [result, setResult] = useState<BulkUploadResult | null>(null);
    const [isPending, startTransition] = useTransition();
    const [showGuide, setShowGuide] = useState(false);

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
                // preview အတွက် raw text ပဲယူမယ် (HTML tag တွေမပါစေဖို့)
                const parsed = parseChaptersFromText(text, false);
                setPreview(parsed);
            } else if (file.name.endsWith('.txt')) {
                const text = await file.text();
                // preview အတွက် raw text ပဲယူမယ်
                const parsed = parseChaptersFromText(text, false);
                setPreview(parsed);
            } else {
                setPreview(null);
            }
        } catch (err: any) {
            setResult({ success: false, error: `Error parsing file: ${err.message}` });
            setPreview(null);
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
                }
            } catch (err: any) {
                setResult({ success: false, error: `Upload failed: ${err.message}` });
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--border)] shrink-0">
                    <div>
                        <h2 className="text-xl font-extrabold text-[var(--foreground)]">Bulk Chapter Upload</h2>
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
                                <p className="font-semibold text-[var(--foreground)]">Method 1 — Burmese/English Heading (Auto-detected)</p>
                                <pre className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 text-xs overflow-x-auto leading-relaxed">
                                    {`အခန်း (၁) စတင်ခြင်း
ဒီတစ်ကလေး ပထမဆုံးအကြောင်းအရာ...

အခန်း (၂) ပြောင်းလဲမှု
ဒုတိယ အကြောင်းအရာ...`}
                                </pre>
                                <p className="font-semibold text-[var(--foreground)]">Method 2 — Delimiter (---, ***, ====)</p>
                                <pre className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 text-xs overflow-x-auto leading-relaxed">
                                    {`ခေါင်းစဉ်
ပထမ အကြောင်းအရာ...
---
ခေါင်းစဉ်
ဒုတိယ အကြောင်းအရာ...`}
                                </pre>
                                <p className="text-xs opacity-70">Burmese digits (၀-၉) and English digits (0-9) are both supported.</p>
                            </div>
                        )}
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
    );
}
