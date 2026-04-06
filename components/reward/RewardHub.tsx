"use client";

import { useRouter } from "next/navigation";
import LotteryWheel from "./LotteryWheel";
import CouponInventory from "./CouponInventory";

interface RewardUser {
    id: string;
    lotteryChances: number;
    couponYield: number;
    couponLongevity: number;
}

export default function RewardHub({ user }: { user: RewardUser }) {
    const router = useRouter();

    const handleSpinResult = () => {
        setTimeout(() => {
            router.refresh();
        }, 500); // 500ms delay to let animations complete before refresh
    };

    return (
        <div className="mb-12 space-y-8">
            <div className="flex justify-center">
                <LotteryWheel chances={user.lotteryChances || 0} onSpinResult={handleSpinResult} />
            </div>

            <CouponInventory />
        </div>
    );
}
