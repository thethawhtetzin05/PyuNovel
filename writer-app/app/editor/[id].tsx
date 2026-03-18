import { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LucideChevronLeft, LucideMaximize2, LucideMinimize2, LucideSave } from "lucide-react-native";
import { getDB } from "@/lib/db";
import { addToSyncQueue, processSyncQueue } from "@/lib/sync";

export default function ChapterEditor() {
    const { id, novelId } = useLocalSearchParams();
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [volumeId, setVolumeId] = useState<number | null>(null);
    const [isPaid, setIsPaid] = useState(false);
    const [sortIndex, setSortIndex] = useState(0);
    
    const [wordCount, setWordCount] = useState(0);
    const [focusMode, setFocusMode] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);
    const [localId, setLocalId] = useState<string | null>(null);

    // Initial Load
    useEffect(() => {
        const loadChapter = async () => {
            try {
                const db = await getDB();
                if (id !== "new") {
                    const data = await db.getFirstAsync<{
                        title: string;
                        content: string;
                        id: string;
                        volumeId: number | null;
                        isPaid: number;
                        sortIndex: number;
                    }>("SELECT * FROM draft_chapters WHERE id = ?", [id as string]);

                    if (data) {
                        setTitle(data.title);
                        setContent(data.content);
                        setLocalId(data.id);
                        setVolumeId(data.volumeId);
                        setIsPaid(!!data.isPaid);
                        setSortIndex(data.sortIndex);
                    }
                } else {
                    // Generate a temporary ID for new draft that persists for this session
                    setLocalId(Math.random().toString(36).substring(7));
                }
            } catch (e) {
                console.error("Load error:", e);
            } finally {
                setLoading(false);
            }
        };

        loadChapter();
    }, [id]);

    useEffect(() => {
        // Update word count
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        setWordCount(words);

        if (loading) return;

        // Auto-save logic (debounced)
        const timeout = setTimeout(async () => {
            await saveDraft();
        }, 2000);

        return () => clearTimeout(timeout);
    }, [content, title, loading]);

    const saveDraft = async () => {
        if (!content.trim() || !localId) return;
        try {
            const db = await getDB();
            const now = new Date().toISOString();
            
            // Save to local drafts
            await db.runAsync(
                "INSERT OR REPLACE INTO draft_chapters (id, novelId, title, content, sortIndex, isPaid, volumeId, status, localUpdatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [localId, Number(novelId) || 0, title, content, sortIndex, isPaid ? 1 : 0, volumeId, 'draft', now]
            );

            // Add to sync queue
            await addToSyncQueue(
                id === "new" ? "create_chapter" : "update_chapter",
                "chapters",
                localId,
                { 
                    novelId: Number(novelId), 
                    title, 
                    content,
                    sortIndex,
                    isPaid,
                    volumeId,
                    updatedAt: now // Send local time for LWW
                }
            );

            // Trigger background sync
            processSyncQueue().catch(console.error);

            setLastSaved(new Date());
        } catch (e) {
            console.error("Save error:", e);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator size="large" color="#0ea5e9" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-background"
        >
            {/* Header - Hidden in Focus Mode */}
            {!focusMode && (
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-border bg-card">
                    <Pressable onPress={() => router.back()} className="p-2">
                        <LucideChevronLeft size={24} color="#0ea5e9" />
                    </Pressable>
                    <View className="items-center">
                        <Text className="text-xs text-muted-foreground" style={{ fontFamily: "MyanmarText" }}>
                            {lastSaved ? `နောက်ဆုံးသိမ်းဆည်းမှု - ${lastSaved.toLocaleTimeString()}` : "သိမ်းဆည်းနေသည်..."}
                        </Text>
                    </View>
                    <Pressable onPress={() => setFocusMode(true)} className="p-2">
                        <LucideMaximize2 size={20} color="#71717a" />
                    </Pressable>
                </View>
            )}

            <ScrollView
                className="flex-1 px-6 pt-4"
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                <TextInput
                    className="text-2xl font-bold mb-4 text-foreground"
                    placeholder="အခန်းခေါင်းစဉ်"
                    style={{ fontFamily: "MyanmarTextBold" }}
                    value={title}
                    onChangeText={setTitle}
                    placeholderTextColor="#a1a1aa"
                />

                <TextInput
                    className="text-lg leading-8 text-foreground"
                    placeholder="ဒီမှာ စတင်ရေးသားပါ..."
                    multiline
                    scrollEnabled={false}
                    style={{ fontFamily: "MyanmarText" }}
                    value={content}
                    onChangeText={setContent}
                    placeholderTextColor="#a1a1aa"
                />
            </ScrollView>

            {/* Footer / Status Bar - Minimal in Focus Mode */}
            <View className={`flex-row items-center justify-between px-6 py-2 border-t border-border bg-card ${focusMode ? 'opacity-40' : ''}`}>
                <Text className="text-xs text-muted-foreground" style={{ fontFamily: "MyanmarText" }}>
                    စကားလုံးပေါင်း - {wordCount}
                </Text>

                {focusMode && (
                    <Pressable onPress={() => setFocusMode(false)} className="p-2">
                        <LucideMinimize2 size={20} color="#71717a" />
                    </Pressable>
                )}

                {!focusMode && (
                    <Pressable className="flex-row items-center bg-primary px-3 py-1 rounded-full">
                        <LucideSave size={14} color="white" />
                        <Text className="text-white text-xs ml-1" style={{ fontFamily: "MyanmarText" }}>ထုတ်ဝေမည်</Text>
                    </Pressable>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}
