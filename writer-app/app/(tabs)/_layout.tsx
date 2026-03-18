import { Tabs } from "expo-router";
import { LucideLayoutDashboard, LucidePlusCircle, LucideUser } from "lucide-react-native";

export default function TabsLayout() {
    return (
        <Tabs screenOptions={{
            headerShown: true,
            tabBarActiveTintColor: "#0ea5e9", // primary color
            tabBarLabelStyle: { fontFamily: "MyanmarText", fontSize: 10 }
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: "ဒက်ရှ်ဘုတ်",
                    tabBarIcon: ({ color }: { color: string }) => <LucideLayoutDashboard size={24} color={color} />,
                    headerTitle: "PyuNovel Writer",
                    headerTitleStyle: { fontFamily: "MyanmarTextBold" }
                }}
            />
            <Tabs.Screen
                name="create"
                options={{
                    title: "အသစ်ဖန်တီး",
                    tabBarIcon: ({ color }: { color: string }) => <LucidePlusCircle size={24} color={color} />,
                    headerTitle: "ဝတ္ထုအသစ် ဖန်တီးရန်",
                    headerTitleStyle: { fontFamily: "MyanmarTextBold" }
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "ကိုယ်ရေးအချက်အလက်",
                    tabBarIcon: ({ color }: { color: string }) => <LucideUser size={24} color={color} />,
                    headerTitle: "မိမိ၏ အချက်အလက်များ",
                    headerTitleStyle: { fontFamily: "MyanmarTextBold" }
                }}
            />
        </Tabs>
    );
}
