"use client";

import { useEffect, useState } from "react";
import { Link } from '@/i18n/routing';
import { Button } from "@/components/ui/button";
import { BookOpen, X } from "lucide-react";

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
            className="flex items-center gap-4 px-5 py-4 rounded-2xl mb-2 animate-in fade-in slide-in-from-right-4 duration-500 shadow-2xl border border-primary/20 backdrop-blur-md bg-card/95"
        >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary shadow-inner">
                <BookOpen size={20} />
            </div>
            
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-primary mb-0.5">
                    Continue Reading
                </p>
                <h4 className="text-sm font-bold truncate text-foreground leading-tight">
                    {latest.novelTitle}
                </h4>
                <p className="text-[11px] truncate text-muted-foreground mt-0.5">
                    {latest.chapterTitle}
                </p>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="h-9 px-4 rounded-xl font-bold shadow-md shadow-primary/20"
                >
                    <Link href={`/novel/${latest.slug}/${latest.chapterId}`}>
                        Read
                    </Link>
                </Button>
                
                <button
                    type="button"
                    onClick={() => setLatest(null)}
                    className="p-1.5 rounded-full transition-colors hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                    aria-label="Dismiss"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
