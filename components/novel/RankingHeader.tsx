"use client";

import { useRouter, usePathname } from 'next/navigation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface RankingHeaderProps {
    currentType: string;
    tabs: { id: string, label: string }[];
}

export default function RankingHeader({ currentType, tabs }: RankingHeaderProps) {
    const router = useRouter();
    const pathname = usePathname();

    const handleValueChange = (value: string) => {
        router.push(`${pathname}?type=${value}`);
    };

    return (
        <div className="flex items-center justify-between mb-8 pt-8 px-4 md:px-0">
            <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tight">
                Ranking
            </h1>

            <div className="w-48 md:w-64">
                <Select value={currentType} onValueChange={handleValueChange}>
                    <SelectTrigger className="w-full bg-[var(--surface)] border-[var(--border)] rounded-xl font-bold text-sm h-11 px-4 shadow-sm focus:ring-[var(--action)]/50">
                        <SelectValue placeholder="Select rank type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--surface)] border-[var(--border)] rounded-xl shadow-xl">
                        {tabs.map((tab) => (
                            <SelectItem
                                key={tab.id}
                                value={tab.id}
                                className="font-bold text-sm cursor-pointer py-3"
                            >
                                {tab.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
