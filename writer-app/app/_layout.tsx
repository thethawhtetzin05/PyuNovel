import "../global.css";
import { Stack } from "expo-router";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { initDatabase } from "@/lib/db";
import { processSyncQueue } from "@/lib/sync";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        async function prepare() {
            try {
                // Initialize Database
                await initDatabase();

                // Process any pending sync items
                processSyncQueue().catch(console.error);

                // Load Fonts
                await Font.loadAsync({
                    MyanmarText: require("../assets/fonts/mmrtext.ttf"),
                    MyanmarTextBold: require("../assets/fonts/mmrtextb.ttf"),
                });
            } catch (e) {
                console.warn(e);
            } finally {
                setLoaded(true);
                SplashScreen.hideAsync();
            }
        }
        prepare();
    }, []);

    if (!loaded) return null;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }} />
        </GestureHandlerRootView>
    );
}
