"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function LotteryWheel({ chances, onSpinResult }: { chances: number, onSpinResult: (res: { success: boolean; message: string; reward: string }) => void }) {
    const [isSpinning, setIsSpinning] = useState(false);
    const [resultMsg, setResultMsg] = useState("");

    const handleSpin = async () => {
        if (chances <= 0 || isSpinning) return;
        setIsSpinning(true);
        setResultMsg("Spinning... 🎰");

        try {
            const res = await fetch("/api/reward/lottery", { method: "POST" });
            const data = await res.json() as { success: boolean; message: string; reward: string; error?: string };

            // Fake delay for suspense
            setTimeout(() => {
                setIsSpinning(false);
                if (data.success) {
                    setResultMsg(data.message);
                    onSpinResult(data);
                } else {
                    setResultMsg(data.error || "Failed to spin");
                }
            }, 1500);

        } catch (error) {
            console.error("Lottery error:", error);
            setIsSpinning(false);
            setResultMsg("Network error");
        }
    };

    return (
        <div className="flex flex-col items-center bg-[var(--surface-2)] p-8 rounded-3xl border border-[var(--border)] shadow-xl text-center group ring-2 ring-transparent transition-all relative overflow-hidden w-full max-w-lg">
            <h3 className="text-2xl font-black mb-2 text-[var(--foreground)]">Level-Up Lottery 🎰</h3>
            <p className="text-[var(--text-muted)] text-sm mb-4 font-medium">Chances available: <span className="text-[var(--action)] font-black text-lg">{chances}</span></p>

            <Button
                onClick={handleSpin}
                disabled={chances <= 0 || isSpinning}
                variant="premium"
                className="text-lg px-8 py-6 h-14 w-full shadow-xl hover:scale-105 active:scale-95 transition-all mb-4 relative overflow-hidden"
            >
                <span className="relative z-10 flex items-center gap-2">
                    {isSpinning ? "Casting Spell... ✨" : "Spin the Wheel!"}
                </span>
            </Button>

            {resultMsg && (
                <div className="bg-[var(--action)]/10 text-[var(--action)] px-4 py-3 rounded-xl border border-[var(--action)]/20 animate-in fade-in zoom-in duration-300 shadow-inner w-full font-bold">
                    {resultMsg}
                </div>
            )}
        </div>
    );
}
