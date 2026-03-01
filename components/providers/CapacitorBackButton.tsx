'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export function CapacitorBackButton() {
    const router = useRouter();

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        // Listen to hardware back button on Android
        const backButtonListener = App.addListener('backButton', (data: any) => {
            if (data.canGoBack) {
                // If the webview can go back, route back using Next.js router
                // Alternatively we can use window.history.back(), but router.back() integrates better
                router.back();
            } else {
                // If there is no history to go back to, exit the app natively
                App.exitApp();
            }
        });

        return () => {
            // Cleanup listener on unmount
            backButtonListener.then((listener: any) => listener.remove());
        };
    }, [router]);

    return null; // This component does not render anything
}
