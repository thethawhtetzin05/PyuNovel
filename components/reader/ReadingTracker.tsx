"use client";

import { useEffect } from "react";
import { saveReadingProgress } from "@/components/home/ContinueReading";

type Props = {
    slug: string;
    chapterId: string;
    novelTitle: string;
    chapterTitle: string;
};

export default function ReadingTracker({ slug, chapterId, novelTitle, chapterTitle }: Props) {
    useEffect(() => {
        saveReadingProgress({ slug, chapterId, novelTitle, chapterTitle });
    }, [slug, chapterId, novelTitle, chapterTitle]);

    return null;
}
