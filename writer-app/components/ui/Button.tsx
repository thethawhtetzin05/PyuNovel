import { type VariantProps, cva } from "class-variance-authority";
import { Pressable, Text } from "react-native";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "flex-row items-center justify-center rounded-md px-4 py-2",
    {
        variants: {
            variant: {
                default: "bg-primary",
                destructive: "bg-destructive",
                outline: "border border-input bg-background",
                secondary: "bg-secondary",
                ghost: "",
                link: "",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

const textVariants = cva("text-sm font-medium", {
    variants: {
        variant: {
            default: "text-primary-foreground",
            destructive: "text-destructive-foreground",
            outline: "text-foreground",
            secondary: "text-secondary-foreground",
            ghost: "text-foreground",
            link: "text-primary underline",
        },
    },
    defaultVariants: {
        variant: "default",
    },
});

interface ButtonProps extends React.ComponentPropsWithoutRef<typeof Pressable>, VariantProps<typeof buttonVariants> {
    label: string;
    className?: string;
    textClassName?: string;
}

export function Button({ label, className, textClassName, variant, size, ...props }: ButtonProps) {
    return (
        <Pressable
            className={cn(buttonVariants({ variant, size }), props.disabled && "opacity-50", className)}
            {...props}
        >
            <Text className={cn(textVariants({ variant }), textClassName)} style={{ fontFamily: "MyanmarText" }}>
                {label}
            </Text>
        </Pressable>
    );
}
