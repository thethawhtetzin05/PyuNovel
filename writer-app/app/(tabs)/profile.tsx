import { ScrollView, View, Text } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ProfileScreen() {
    return (
        <ScrollView className="flex-1 bg-background p-4">
            <View className="items-center mb-8 mt-4">
                <View className="w-20 h-20 rounded-full bg-accent items-center justify-center mb-4">
                    <Text className="text-2xl font-bold text-accent-foreground" style={{ fontFamily: "MyanmarTextBold" }}>A</Text>
                </View>
                <Text className="text-xl font-bold" style={{ fontFamily: "MyanmarTextBold" }}>Author Name</Text>
                <Text className="text-muted-foreground" style={{ fontFamily: "MyanmarText" }}>author@example.com</Text>
            </View>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg">အကောင့် အချက်အလက်</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <View className="flex-row justify-between">
                        <Text className="text-muted-foreground" style={{ fontFamily: "MyanmarText" }}>အခန်းပေါင်း</Text>
                        <Text className="font-medium">0</Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-muted-foreground" style={{ fontFamily: "MyanmarText" }}>စုစုပေါင်း Views</Text>
                        <Text className="font-medium">0</Text>
                    </View>
                </CardContent>
            </Card>

            <View className="space-y-4">
                <Button label="Password ပြောင်းရန်" variant="outline" className="w-full" />
                <Button label="ထွက်မည် (Logout)" variant="destructive" className="w-full" />
            </View>

            <Text className="text-center text-xs text-muted-foreground mt-8" style={{ fontFamily: "MyanmarText" }}>
                PyuNovel Writer v1.0.0
            </Text>
        </ScrollView>
    );
}
