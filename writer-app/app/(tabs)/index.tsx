import { ScrollView, View, Text, Pressable, ActivityIndicator } from "react-native";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useEffect, useState, useCallback } from "react";
import { getDB } from "@/lib/db";
import { useFocusEffect, useRouter } from "expo-router";

export default function DashboardScreen() {
    const [stats, setStats] = useState({ novelCount: 0, draftCount: 0 });
    const [loading, setLoading] = useState(true);
    const [drafts, setDrafts] = useState<any[]>([]);
    const router = useRouter();

    const fetchStats = async () => {
        try {
            const db = await getDB();
            
            // Get draft count
            const draftResult = await db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM draft_chapters");
            
            // Get distinct novel count from drafts
            const novelResult = await db.getFirstAsync<{ count: number }>("SELECT COUNT(DISTINCT novelId) as count FROM draft_chapters");

            // Get recent drafts
            const recentDrafts = await db.getAllAsync("SELECT * FROM draft_chapters ORDER BY localUpdatedAt DESC LIMIT 5");

            setStats({
                novelCount: novelResult?.count || 0,
                draftCount: draftResult?.count || 0
            });
            setDrafts(recentDrafts);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchStats();
        }, [])
    );

    return (
        <ScrollView className="flex-1 bg-background p-4">
            <View className="flex-row justify-between items-center mb-6">
                <View>
                    <Text className="text-2xl font-bold text-foreground" style={{ fontFamily: "MyanmarTextBold" }}>
                        မင်္ဂလာပါ၊ စာရေးဆရာ
                    </Text>
                    <Text className="text-muted-foreground" style={{ fontFamily: "MyanmarText" }}>
                        သင်၏ ဝတ္ထုများကို စီမံခန့်ခွဲပါ။
                    </Text>
                </View>
            </View>

            <View className="flex-row gap-x-4 mb-6">
                <Card className="flex-1">
                    <CardHeader className="p-4 flex-col items-center">
                        <Text className="text-2xl font-bold text-primary" style={{ fontFamily: "MyanmarTextBold" }}>{stats.novelCount}</Text>
                        <CardDescription>ဝတ္ထုစုစုပေါင်း</CardDescription>
                    </CardHeader>
                </Card>
                <Card className="flex-1">
                    <CardHeader className="p-4 flex-col items-center">
                        <Text className="text-2xl font-bold text-primary" style={{ fontFamily: "MyanmarTextBold" }}>{stats.draftCount}</Text>
                        <CardDescription>မူကြမ်းစုစုပေါင်း</CardDescription>
                    </CardHeader>
                </Card>
            </View>

            <Text className="text-lg font-semibold mb-4" style={{ fontFamily: "MyanmarTextBold" }}>
                လတ်တလော မူကြမ်းများ
            </Text>

            {loading ? (
                <ActivityIndicator size="small" color="#0ea5e9" />
            ) : drafts.length > 0 ? (
                drafts.map((draft) => (
                    <Pressable 
                        key={draft.id} 
                        onPress={() => router.push({ pathname: "/editor/[id]", params: { id: draft.id, novelId: draft.novelId } })}
                    >
                        <Card className="mb-4">
                            <CardContent className="p-4">
                                <Text className="text-base font-bold text-foreground" style={{ fontFamily: "MyanmarTextBold" }}>
                                    {draft.title || "ခေါင်းစဉ်မရှိ"}
                                </Text>
                                <Text className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "MyanmarText" }}>
                                    နောက်ဆုံးပြင်ဆင်မှု - {new Date(draft.localUpdatedAt).toLocaleString()}
                                </Text>
                                <View className="mt-2 self-start bg-secondary px-2 py-0.5 rounded">
                                    <Text className="text-[10px] text-secondary-foreground uppercase">{draft.status}</Text>
                                </View>
                            </CardContent>
                        </Card>
                    </Pressable>
                ))
            ) : (
                <Card className="mb-4">
                    <CardContent className="p-6 items-center justify-center">
                        <Text className="text-muted-foreground mb-4" style={{ fontFamily: "MyanmarText" }}>
                            မူကြမ်းများ မရှိသေးပါ။
                        </Text>
                        <Button 
                            label="ဝတ္ထုအသစ် စတင်မည်" 
                            className="w-full" 
                            onPress={() => router.push("/(tabs)/create")}
                        />
                    </CardContent>
                </Card>
            )}
        </ScrollView>
    );
}
