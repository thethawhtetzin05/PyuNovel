"use client";

import { useState } from "react";
import { Copy, Check, X, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface TelegramConnectFormProps {
    isLinked: boolean;
    initialToken?: string | null;
    tgName?: string | null;
    tgUsername?: string | null;
}

export default function TelegramConnectForm({
    isLinked,
    initialToken,
    tgName,
    tgUsername
}: TelegramConnectFormProps) {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(initialToken || null);
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const generateToken = async () => {
        setIsLoading(true);
        try {
            // Because the component is inside `[locale]`, fetch might try to resolve relative to it.
            // Ensure absolute path from domain root
            const res = await fetch(`${window.location.origin}/api/telegram/generate-token`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json() as { token: string };
                setToken(data.token);
            }
        } catch (error) {
            console.error("Failed to generate token", error);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!token) return;
        navigator.clipboard.writeText(token); // 👈 Changed to copy only the token
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const disconnectTelegram = async () => {
        if (!confirm("Are you sure you want to disconnect your Telegram account?")) return;
        setIsLoading(true);
        try {
            await fetch(`${window.location.origin}/api/telegram/disconnect`, { method: 'POST' });
            router.refresh(); // Refresh Next.js server component tree properly
            setTimeout(() => window.location.reload(), 300); // Fallback reload just in case
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 mt-12 mb-12">
            <h2 className="text-xl font-black text-[var(--foreground)] mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0088cc" className="w-6 h-6">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.69-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.667 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                Telegram Integration
            </h2>
            <p className="text-[var(--text-muted)] text-sm mb-6">
                Connect your Telegram account to publish chapters directly by sending messages to our Bot.
            </p>

            {isLinked ? (
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                    <div className="flex-1 flex items-center gap-3 w-full">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                            <Check size={20} />
                        </div>
                        <div>
                            <p className="text-emerald-500 font-bold text-sm">Account Connected</p>
                            <p className="text-[var(--text-muted)] text-xs">
                                Linked to: <span className="text-[var(--foreground)] font-medium">{tgName || "Unknown"}</span>
                                {tgUsername && <span className="ml-1 opacity-70">({tgUsername})</span>}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={generateToken}
                            disabled={isLoading}
                            className="flex-1 sm:flex-none px-4 py-2 bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] rounded-lg text-xs font-bold hover:bg-[var(--surface-3)] transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                            Re-Link
                        </button>
                        <button
                            onClick={disconnectTelegram}
                            disabled={isLoading}
                            className="flex-1 sm:flex-none px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                        >
                            <X size={14} />
                            Disconnect
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {!token ? (
                        <button
                            onClick={generateToken}
                            disabled={isLoading}
                            className="w-full sm:w-auto px-6 py-2.5 bg-[#0088cc] text-white rounded-xl text-sm font-bold hover:bg-[#0077b5] transition-colors flex items-center justify-center gap-2 shadow-lg"
                        >
                            {isLoading ? "Generating..." : "Generate Connection Link"}
                        </button>
                    ) : (
                        <div className="bg-[var(--surface)] border border-[var(--border)] p-5 rounded-xl space-y-4">
                            <p className="text-sm text-[var(--foreground)]">
                                1. Open our Telegram Bot: <a href="https://t.me/PyuNovel_Bot" target="_blank" className="text-[#0088cc] font-bold hover:underline">@PyuNovel_Bot</a>
                            </p>
                            <p className="text-sm text-[var(--foreground)]">
                                2. Copy the code below and send it to the bot. This code expires in 5 minutes:
                            </p>

                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-[var(--surface-3)] px-4 py-3 rounded-lg text-[var(--action)] font-mono text-sm border border-[var(--border)] select-all overflow-x-auto text-center tracking-widest font-black text-lg">
                                    {token}
                                </code>
                                <button
                                    onClick={copyToClipboard}
                                    className="p-3 bg-[var(--surface-3)] border border-[var(--border)] rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors shrink-0"
                                    title="Copy to clipboard"
                                >
                                    {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                                </button>
                            </div>
                            <p className="text-xs text-[var(--text-muted)] italic">
                                * Once you send the message, refresh this page to see your connection status.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
