'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';


interface PaidChapterBlockProps {
    chapterId: number;
    novelId: number;
    chapterPrice: number;
    slug: string;
    sortIndex: string;
}

export default function PaidChapterBlock({
    chapterId,
    novelId,
    chapterPrice,
    slug,
    sortIndex
}: PaidChapterBlockProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUnlock = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/novel/chapter/unlock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chapterId,
                    novelId,
                    chapterPrice,
                    slug,
                    sortIndex
                }),
            });

            const res = await response.json() as { success: boolean, error?: string };

            if (!res.success) {
                setError(res.error || 'Failed to unlock');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-12 mt-8 mb-16 rounded-3xl bg-[var(--surface-2)] border border-[var(--border)] text-center max-w-2xl mx-auto shadow-lg">
            <div className="w-16 h-16 bg-[var(--surface)] text-[var(--accent)] rounded-full flex items-center justify-center text-3xl mb-6 shadow-sm border border-[var(--border)]">
                🔒
            </div>
            <h3 className="text-2xl font-bold mb-3 text-[var(--foreground)]">Paid Chapter</h3>
            <p className="text-[var(--text-muted)] mb-8 px-4 text-lg">
                This is a premium chapter. Read to support the author!
            </p>

            {error && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm w-full max-w-sm">
                    {error}
                </div>
            )}

            <Button
                onClick={handleUnlock}
                disabled={loading}
                className="w-full max-w-sm py-6 rounded-2xl text-lg font-bold flex flex-col gap-1 items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
                <span>Unlock Chapter</span>
                <span className="text-sm opacity-80 font-normal">Costs {chapterPrice} 🪙</span>
            </Button>
        </div>
    );
}
