"use client";

import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { saveChapterOffline, initMobileDB } from "@/lib/mobile-db";
import { Download, Check, Loader2 } from "lucide-react";

export default function OfflineDownloadButton({ slug }: { slug: string }) {
    const [isNative, setIsNative] = useState(false);
    const [status, setStatus] = useState<'idle' | 'downloading' | 'done' | 'error'>('idle');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setIsNative(Capacitor.isNativePlatform());
    }, []);

    const handleDownload = async () => {
        try {
            setStatus('downloading');
            setProgress(0);

            // ၁။ API ကနေ အကုန်လှမ်းယူမယ် (Header မှာ Secret Key ထည့်ပို့မယ်)
            const res = await fetch(`/api/novel/${slug}/full-download`, {
                headers: {
                    "X-App-Secret": "PYU_NOVEL_DEFAULT_SECRET"
                }
            });
            const data = await res.json() as { success: boolean, novel: any, chapters: any[] };

            if (!data.success) throw new Error("Failed to fetch chapters");

            // ၂။ SQLite ထဲ သိမ်းမယ်
            await initMobileDB();

            const total = data.chapters.length;
            for (let i = 0; i < total; i++) {
                const ch = data.chapters[i];

                // ၃။ Content Obfuscation ကို ပြန်ဖြည်မယ် (Base64 Decode)
                let finalContent = ch.content;
                if ((ch as any).obfuscated) {
                    try {
                        finalContent = atob(ch.content);
                    } catch (e) {
                        console.error("Decoding error:", e);
                    }
                }

                const prev = i > 0 ? data.chapters[i - 1].id : null;
                const next = i < total - 1 ? data.chapters[i + 1].id : null;

                await saveChapterOffline({
                    ...ch,
                    content: finalContent,
                    prevChapterId: prev,
                    nextChapterId: next
                }, data.novel.title);

                setProgress(Math.round(((i + 1) / total) * 100));
            }

            setStatus('done');
        } catch (error) {
            console.error(error);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    if (!isNative) return null; // Website ဆိုရင် မပြဘူး

    return (
        <button
            onClick={handleDownload}
            disabled={status === 'downloading' || status === 'done'}
            className={`
                flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold transition-all
                ${status === 'done' ? 'bg-green-100 text-green-700' : 'bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--surface-3)]'}
                ${status === 'downloading' ? 'opacity-80 cursor-wait' : ''}
            `}
        >
            {status === 'idle' && (
                <>
                    <Download size={20} />
                    Download Offline
                </>
            )}
            {status === 'downloading' && (
                <>
                    <Loader2 size={20} className="animate-spin" />
                    Downloading {progress}%
                </>
            )}
            {status === 'done' && (
                <>
                    <Check size={20} />
                    Downloaded
                </>
            )}
            {status === 'error' && (
                <span className="text-red-500">Failed. Retry?</span>
            )}
        </button>
    );
}
