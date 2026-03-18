import { ScrollView, View, Text, Alert } from "react-native";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { getDB } from "@/lib/db";
import { addToSyncQueue, processSyncQueue } from "@/lib/sync";
import { useRouter } from "expo-router";

export default function CreateNovelScreen() {
    const [title, setTitle] = useState("");
    const [englishTitle, setEnglishTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleCreate = async () => {
        if (!title || !englishTitle) {
            Alert.alert("Error", "Title and English Title are required");
            return;
        }

        setLoading(true);
        try {
            const db = await getDB();
            const localId = "novel_" + Math.random().toString(36).substring(7);
            const now = new Date().toISOString();

            // Save to local draft_novels
            await db.runAsync(
                "INSERT INTO draft_novels (id, title, englishTitle, author, description, tags, status, localUpdatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [localId, title, englishTitle, author, description, tags, 'draft', now]
            );

            // Add to sync queue
            await addToSyncQueue(
                "create_novel",
                "novels",
                localId,
                { title, englishTitle, author, description, tags }
            );

            // Trigger sync
            processSyncQueue().catch(console.error);

            Alert.alert("Success", "Novel draft created and queuing for sync.");
            router.replace("/(tabs)");
        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView className="flex-1 bg-background p-4">
            <View className="space-y-6">
                <View>
                    <Text className="text-xl font-bold mb-4" style={{ fontFamily: "MyanmarTextBold" }}>
                        ဝတ္ထုအသစ် ဖန်တီးမည်
                    </Text>
                    <Text className="text-muted-foreground mb-6" style={{ fontFamily: "MyanmarText" }}>
                        သင့်ရဲ့ စိတ်ကူးသစ်တွေကို စတင်လိုက်ပါ။
                    </Text>
                </View>

                <Input
                    label="ဝတ္ထုခေါင်းစဉ်"
                    placeholder="ဥပမာ - မြူမှောင်ဝေသီ"
                    value={title}
                    onChangeText={setTitle}
                />

                <Input
                    label="English Title (for URL)"
                    placeholder="e.g. shadow-in-the-mist"
                    value={englishTitle}
                    onChangeText={setEnglishTitle}
                    autoCapitalize="none"
                />

                <Input
                    label="ကလောင်အမည်"
                    placeholder="ဥပမာ - စာရေးဆရာ အမည်"
                    value={author}
                    onChangeText={setAuthor}
                />

                <Input
                    label="Tags (ကော်မာ ခြားရေးပါ)"
                    placeholder="Action, Romance, Comedy"
                    value={tags}
                    onChangeText={setTags}
                />

                <View className="space-y-2">
                    <Text className="text-sm font-medium text-foreground" style={{ fontFamily: "MyanmarText" }}>
                        အညွှန်း
                    </Text>
                    <Input
                        placeholder="ဝတ္ထုအကျဉ်းချုပ် ရေးသားရန်..."
                        multiline
                        numberOfLines={4}
                        className="h-32 text-top"
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                <Button 
                    label={loading ? "သိမ်းဆည်းနေသည်..." : "ဝတ္ထုဖန်တီးမည်"} 
                    className="mt-4" 
                    onPress={handleCreate}
                    disabled={loading}
                />
            </View>
        </ScrollView>
    );
}
