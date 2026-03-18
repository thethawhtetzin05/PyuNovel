import { View, Text } from "react-native";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) {
    return <View className={cn("rounded-lg border border-border bg-card shadow-sm", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) {
    return <View className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof Text>) {
    return (
        <Text
            className={cn("text-2xl font-semibold leading-none tracking-tight text-foreground", className)}
            style={{ fontFamily: "MyanmarTextBold" }}
            {...props}
        />
    );
}

export function CardDescription({ className, ...props }: React.ComponentPropsWithoutRef<typeof Text>) {
    return (
        <Text
            className={cn("text-sm text-muted-foreground", className)}
            style={{ fontFamily: "MyanmarText" }}
            {...props}
        />
    );
}

export function CardContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) {
    return <View className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) {
    return <View className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}
