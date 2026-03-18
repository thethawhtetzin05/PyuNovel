import { TextInput, View, Text } from "react-native";
import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentPropsWithoutRef<typeof TextInput> {
    label?: string;
    error?: string;
    className?: string; // For NativeWind
    placeholder?: string;
    multiline?: boolean;
    value?: string;
    onChangeText?: (text: string) => void;
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
    keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
    secureTextEntry?: boolean;
    numberOfLines?: number;
}

export function Input({ className, label, error, ...props }: InputProps) {
    return (
        <View className="flex flex-col space-y-2">
            {label && (
                <Text className="text-sm font-medium text-foreground" style={{ fontFamily: "MyanmarText" }}>
                    {label}
                </Text>
            )}
            <TextInput
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground",
                    error && "border-destructive",
                    className
                )}
                placeholderTextColor="#a1a1aa"
                style={{ fontFamily: "MyanmarText" }}
                {...props}
            />
            {error && (
                <Text className="text-xs text-destructive" style={{ fontFamily: "MyanmarText" }}>
                    {error}
                </Text>
            )}
        </View>
    );
}
