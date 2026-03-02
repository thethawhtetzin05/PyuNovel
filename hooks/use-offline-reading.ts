import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { getChapterOffline, saveChapterOffline, initMobileDB } from '@/lib/mobile-db';

export function useOfflineReading(chapterId: string, fetchOnline: () => Promise<any>) {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            setIsLoading(true);

            // ၁။ မိုဘိုင်း App ဖြစ်မှ Offline စနစ် အလုပ်လုပ်မယ်
            if (Capacitor.isNativePlatform()) {
                await initMobileDB();
                
                // အရင်ဆုံး Offline Database ထဲမှာ ရှိမရှိ ရှာကြည့်မယ် (မြန်အောင်လို့)
                const offlineData = await getChapterOffline(chapterId);
                
                if (offlineData) {
                    // Offline ရှိရင် အရင်ပြထားမယ် (Instant Load)
                    if (isMounted) {
                        setData(offlineData);
                        setIsLoading(false);
                        setIsOffline(true);
                    }
                }
            }

            // ၂။ Online ကနေ လှမ်းဆွဲမယ် (နောက်ဆုံးရ အခြေအနေ ရအောင်)
            try {
                const onlineData = await fetchOnline();
                
                if (isMounted && onlineData) {
                    setData(onlineData); // Data အသစ်နဲ့ အစားထိုးမယ်
                    setIsLoading(false);
                    setIsOffline(false);

                    // ၃။ နောက်တစ်ခါအတွက် Offline သိမ်းမယ်
                    if (Capacitor.isNativePlatform()) {
                        // Note: novelTitle ကို API response ထဲကနေ ယူဖို့ လိုပါမယ်
                        await saveChapterOffline(onlineData, onlineData.novelTitle || "Unknown Novel");
                    }
                }
            } catch (error) {
                console.error("Online fetch failed:", error);
                // Online ရှာမရရင်, Offline data ရှိပြီးသားဆိုရင် ပြစရာမလိုတော့ဘူး
                // မရှိသေးရင် Error ပြဖို့ state ချိန်ရမယ် (ဒီမှာတော့ Offline ကရရင် ပြီးပြီလို့ ယူဆထားမယ်)
                if (isMounted && !data) setIsLoading(false); 
            }
        };

        loadData();

        return () => { isMounted = false; };
    }, [chapterId]);

    return { data, isLoading, isOffline };
}
