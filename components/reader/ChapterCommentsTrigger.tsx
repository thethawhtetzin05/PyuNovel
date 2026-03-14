'use client';

import React from 'react';
import { MessageSquare, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChapterCommentsTrigger() {
    return (
        <div className="mt-16 pt-8 flex flex-col items-center">
            <div className="flex items-center gap-16 md:gap-24">
                {/* Comment Toggle Button using shadcn UI components */}
                <div className="flex flex-col items-center group">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.dispatchEvent(new CustomEvent('open-chapter-comments'))}
                        className="w-14 h-14 rounded-full border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300 shadow-sm"
                    >
                        <MessageSquare size={24} className="transition-transform group-hover:scale-110" />
                    </Button>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 dark:text-gray-400 mt-3 group-hover:text-indigo-600 transition-all">Comment</span>
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-0.5">Chapter discussion</span>
                </div>

                {/* Vote Placeholder (Mirroring Webnovel UI) using shadcn UI components */}
                <div className="flex flex-col items-center opacity-30 select-none cursor-not-allowed">
                    <Button
                        variant="outline"
                        size="icon"
                        disabled
                        className="w-14 h-14 rounded-full border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 shadow-none"
                    >
                        <ThumbsUp size={24} />
                    </Button>
                    <span className="text-[10px] uppercase font-bold tracking-widest mt-3">Vote</span>
                    <span className="text-xs font-medium mt-0.5">Coming soon</span>
                </div>
            </div>
        </div>
    );
}
