"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function ReportModal({ isOpen, onClose }: Props) {
    const { data: session } = useSession();
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSending(true);
        setStatus("idle");

        try {
            const response = await fetch("/api/report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: message.trim(),
                    url: window.location.href,
                    userId: session?.user?.id,
                    userEmail: session?.user?.email,
                }),
            });

            const result = await response.json() as { success: boolean; error?: string };

            if (result.success) {
                setStatus("success");
                setMessage("");
                setTimeout(() => {
                    onClose();
                    setStatus("idle");
                }, 2000);
            } else {
                setStatus("error");
            }
        } catch (error) {
            console.error("Report failed:", error);
            setStatus("error");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[var(--surface)] w-full max-w-md rounded-2xl border border-[var(--border)] shadow-2xl p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[var(--foreground)]">Report an Issue</h2>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {status === "success" ? (
                    <div className="py-8 text-center">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        </div>
                        <p className="font-bold text-[var(--foreground)]">Report Sent!</p>
                        <p className="text-sm text-[var(--text-muted)] mt-1">Thank you for your feedback.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <p className="text-sm text-[var(--text-muted)] mb-4">
                            Found a bug or have a suggestion? Let us know below.
                        </p>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            placeholder="Describe the issue..."
                            className="w-full h-32 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-4 text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--action)]/50 focus:border-[var(--action)] transition-all resize-none mb-4"
                        />
                        {status === "error" && (
                            <p className="text-red-500 text-xs mb-4">Failed to send report. Please try again.</p>
                        )}
                        <button
                            type="submit"
                            disabled={isSending || !message.trim()}
                            className="w-full h-12 bg-[var(--action)] hover:bg-[var(--action-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-[var(--action)]/20"
                        >
                            {isSending ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending...
                                </span>
                            ) : "Send Report"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
