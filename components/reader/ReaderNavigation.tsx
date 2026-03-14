'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { List, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Link } from '@/i18n/routing';

interface Props {
    novelSlug: string;
    prevIndex: string | null;
    nextIndex: string | null;
}

export default function ReaderNavigation({ novelSlug, prevIndex, nextIndex }: Props) {
    const handleTOCClick = (e: React.MouseEvent) => {
        // Only trigger sidebar on mobile (less than 768px usually, but let's be generous for tablets)
        if (window.innerWidth < 1024) {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('open-toc-sidebar'));
        }
    };

    return (
        <div className="flex justify-between items-center gap-2 md:gap-4">
            {/* Prev Button */}
            {prevIndex ? (
                <Button size="lg" asChild className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold hover:shadow-lg transition-all border-none flex-1 md:flex-none h-12 md:h-14">
                    <Link href={`/novel/${novelSlug}/${prevIndex}`}>
                        <ChevronLeft className="w-4 h-4 mr-1 md:mr-2" />
                        Prev
                    </Link>
                </Button>
            ) : (
                <Button size="lg" disabled className="bg-gray-200 dark:bg-gray-800 text-gray-400 rounded-xl font-bold flex-1 md:flex-none h-12 md:h-14">
                    Prev
                </Button>
            )}

            {/* TOC Button - Sidebar on Mobile, Link on Desktop */}
            <Button
                size="lg"
                asChild
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold hover:shadow-lg transition-all border-none flex-1 md:flex-none h-12 md:h-14 aspect-square md:aspect-auto"
                onClick={handleTOCClick}
            >
                <Link href={`/novel/${novelSlug}?tab=chapters`} title="Table of Contents">
                    <List className="w-5 h-5 md:mr-2" />
                    <span className="hidden md:inline">Contents</span>
                </Link>
            </Button>

            {/* Next Button */}
            {nextIndex ? (
                <Button size="lg" asChild className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold hover:shadow-lg transition-all border-none flex-1 md:flex-none h-12 md:h-14">
                    <Link href={`/novel/${novelSlug}/${nextIndex}`}>
                        Next
                        <ChevronRight className="w-4 h-4 ml-1 md:mr-2" />
                    </Link>
                </Button>
            ) : (
                <Button size="lg" asChild className="bg-gray-900 hover:bg-black text-white rounded-xl font-bold hover:shadow-lg transition-all border-none flex-1 md:flex-none h-12 md:h-14">
                    <Link href={`/novel/${novelSlug}`}>
                        Finish
                        <Check className="w-4 h-4 ml-1 md:mr-2" />
                    </Link>
                </Button>
            )}
        </div>
    );
}
