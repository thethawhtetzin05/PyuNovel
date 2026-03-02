"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { saveChapterOffline, getChapterOffline } from "@/lib/mobile-db";
import ReaderView from "./reader-view";

interface Props {
    chapterId: string;
    novelId: number;
    novelTitle: string;
    chapterTitle: string;
    content: string; // Server content (HTML string with title/date)
    rawContent: string; // Just the body text for saving
    formattedDate: string;
    prevChapterId: string | null;
    nextChapterId: string | null;
}

export default function OfflineReaderWrapper(props: Props) {
    const [offlineContent, setOfflineContent] = useState<string | null>(null);

    // ၁။ ဝင်လာတာနဲ့ Offline Database ထဲ သိမ်းမယ် (Sync)
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const saveData = async () => {
            await saveChapterOffline({
                id: props.chapterId,
                novelId: props.novelId,
                title: props.chapterTitle,
                content: props.rawContent, // သိမ်းရင် Raw Content ပဲ သိမ်းတာ ပိုကောင်းမယ်
                prevChapterId: props.prevChapterId,
                nextChapterId: props.nextChapterId
            }, props.novelTitle);
        };
        saveData();
    }, [props]);

    // ၂။ Server Content ရှိရင် အဲဒါပဲ ပြမယ်
    // ဒီ Component က Server ကနေ Data ရမှ Render မှာဆိုတော့ Offline Error case ကို ဒီမှာ ဖြေရှင်းလို့မရဘူး
    // Offline Error case ကို error.tsx မှာ ဖြေရှင်းရမယ်
    
    return <ReaderView content={props.content} />;
}
