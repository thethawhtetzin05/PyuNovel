"use client";

import { useEffect, useState } from "react";
import { Link } from '@/i18n/routing';

type ReadingProgress = {
    slug: string;
    chapterId: string;
    novelTitle: string;
    chapterTitle: string;
    savedAt: number;
};

export const READING_PROGRESS_KEY = "pyunovel_reading_progress";

export function saveReadingProgress(data: Omit<ReadingProgress, "savedAt">) {
    try {
        const existing: ReadingProgress[] = JSON.parse(localStorage.getItem(READING_PROGRESS_KEY) || "[]");
        const filtered = existing.filter((e) => e.slug !== data.slug);
        const updated = [{ ...data, savedAt: Date.now() }, ...filtered].slice(0, 10);
        localStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(updated));
    } catch {
        // ignore
    }
}

export default function ContinueReadingBanner() {
    const [latest, setLatest] = useState<ReadingProgress | null>(null);

    useEffect(() => {
        try {
            const stored: ReadingProgress[] = JSON.parse(localStorage.getItem(READING_PROGRESS_KEY) || "[]");
            if (stored.length > 0) setLatest(stored[0]);
        } catch {
            // ignore
        }
    }, []);

    if (!latest) return null;

    return (
        <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl mb-2 animate-fade-in"
            style={{
                background: "var(--accent-light)",
                border: "1px solid var(--accent)",
            }}
        >
            <span className="text-base shrink-0">📖</span>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: "var(--foreground)" }}>
                    {latest.novelTitle}
                </p>
                <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                    {latest.chapterTitle}
                </p>
            </div>
            <Link
                href={`/novel/${latest.slug}/${latest.chapterId}`}
                className="btn-primary px-4 py-1.5 text-xs font-semibold shrink-0"
            >
                Continue
            </Link>
            <button
                type="button"
                onClick={() => setLatest(null)}
                className="p-1 rounded-lg transition opacity-40 hover:opacity-80 shrink-0"
                style={{ color: "var(--accent)" }}
                aria-label="Dismiss"
            >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
