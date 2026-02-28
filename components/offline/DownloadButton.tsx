'use client';

/**
 * components/offline/DownloadButton.tsx
 * Novel offline download button — Android app ထဲမှာပဲ မြင်မယ်
 */

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { downloadNovel, deleteOfflineNovel, isNovelDownloaded } from '@/lib/offline/sync';

interface Props {
    slug: string;
}

type State = 'checking' | 'not-downloaded' | 'downloading' | 'downloaded' | 'removing';

export default function DownloadButton({ slug }: Props) {
    const [state, setState] = useState<State>('checking');
    const [progress, setProgress] = useState('');
    const [isNative, setIsNative] = useState(false);

    useEffect(() => {
        // Native platform (Android/iOS) ဆိုမဆို စစ်မယ်
        const native = Capacitor.isNativePlatform();
        setIsNative(native);

        if (native) {
            isNovelDownloaded(slug).then((downloaded) => {
                setState(downloaded ? 'downloaded' : 'not-downloaded');
            });
        }
    }, [slug]);

    // Web browser မှာ ဆိုရင် ဘာမှ မပြဘူး
    if (!isNative) return null;
    if (state === 'checking') return null;

    const handleDownload = async () => {
        setState('downloading');
        setProgress('Preparing...');

        const result = await downloadNovel(slug, (step) => setProgress(step));

        if (result.success) {
            setState('downloaded');
            setProgress('');
        } else {
            setState('not-downloaded');
            setProgress('');
            alert(result.error ?? 'Download failed');
        }
    };

    const handleRemove = async () => {
        setState('removing');
        const ok = await deleteOfflineNovel(slug);
        setState(ok ? 'not-downloaded' : 'downloaded');
    };

    if (state === 'downloading') {
        return (
            <div className="w-full sm:w-auto h-12 px-6 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
                <span className="animate-spin text-base">⏳</span>
                <span>{progress || 'Downloading...'}</span>
            </div>
        );
    }

    if (state === 'removing') {
        return (
            <div className="w-full sm:w-auto h-12 px-6 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
                <span className="animate-spin text-base">⏳</span>
                <span>Removing...</span>
            </div>
        );
    }

    if (state === 'downloaded') {
        return (
            <button
                onClick={handleRemove}
                className="w-full sm:w-auto h-12 px-6 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm group"
            >
                {/* Hover မှာ delete icon ပြမယ် */}
                <span className="group-hover:hidden">✅</span>
                <span className="hidden group-hover:inline">🗑</span>
                <span className="group-hover:hidden">Downloaded</span>
                <span className="hidden group-hover:inline">Remove Offline</span>
            </button>
        );
    }

    // not-downloaded state
    return (
        <button
            onClick={handleDownload}
            className="w-full sm:w-auto h-12 px-6 rounded-xl bg-[var(--surface-2)] text-[var(--foreground)] font-bold border border-[var(--border)] hover:border-[var(--action)] hover:text-[var(--action)] hover:bg-[var(--surface)] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
        >
            <span>📥</span>
            <span>Download Offline</span>
        </button>
    );
}
