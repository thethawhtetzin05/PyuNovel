import { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) return;
        setLoading(true);
        // TODO: Implement actual login logic with Better-Auth
        try {
            // Mock login
            await new Promise(resolve => setTimeout(resolve, 1500));
            await SecureStore.setItemAsync("auth_token", "mock_token_" + Date.now());
            router.replace("/(tabs)");
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView className="flex-1 bg-background p-6 pt-20">
            <View className="items-center mb-10">
                <Text className="text-3xl font-bold text-primary mb-2" style={{ fontFamily: "MyanmarTextBold" }}>
                    PyuNovel
                </Text>
                <Text className="text-muted-foreground" style={{ fontFamily: "MyanmarText" }}>
                    စာရေးဆရာများအတွက် အထူးသီးသန့် App
                </Text>
            </View>

            <View className="space-y-6">
                <Input
                    label="အီးမေးလ်"
                    placeholder="email@example.com"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <Input
                    label="စကားဝှက်"
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <Button
                    label={loading ? "ဝင်ရောက်နေသည်..." : "လော့ဂ်အင် ဝင်မည်"}
                    className="mt-4"
                    onPress={handleLogin}
                    disabled={loading}
                />

                <Text className="text-center text-sm text-muted-foreground mt-6" style={{ fontFamily: "MyanmarText" }}>
                    အကောင့် မရှိသေးပါက Website တွင် အရင်ဖွင့်ပါ။
                </Text>
            </View>
        </ScrollView>
    );
}
