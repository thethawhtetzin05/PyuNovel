import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function Index() {
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const token = await SecureStore.getItemAsync("auth_token");
            if (token) {
                router.replace("/(tabs)");
            } else {
                router.replace("/login");
            }
        };
        checkAuth();
    }, []);

    return (
        <View className="flex-1 items-center justify-center bg-background">
            <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
    );
}
